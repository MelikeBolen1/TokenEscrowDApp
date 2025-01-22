#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct StakePosition<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub staked_amount: BigUint<M>,
    pub rewards: BigUint<M>,
    pub last_stake_timestamp: u64,
    pub unstake_timestamp: u64,
}

#[multiversx_sc::contract]
pub trait StakingContract {
    #[init]
    fn init(&self) {
        self.reward_rate().set(&BigUint::from(5u64)); // %5 yıllık ödül oranı
        self.minimum_stake_amount().set(&BigUint::from(1000000000000000000u64)); // 1 EGLD
        self.unstake_period().set(&(7 * 24 * 60 * 60)); // 7 gün
    }

    // EGLD stake etme
    #[payable("EGLD")]
    #[endpoint]
    fn stake(&self) {
        let payment = self.call_value().egld_value();
        let caller = self.blockchain().get_caller();
        let current_timestamp = self.blockchain().get_block_timestamp();

        require!(
            payment >= self.minimum_stake_amount().get(),
            "Stake amount below minimum"
        );

        // Mevcut stake pozisyonunu kontrol et
        if self.stake_positions(caller.clone()).is_empty() {
            // Yeni stake pozisyonu oluştur
            let position = StakePosition {
                address: caller.clone(),
                staked_amount: payment,
                rewards: BigUint::zero(),
                last_stake_timestamp: current_timestamp,
                unstake_timestamp: 0,
            };
            self.stake_positions(caller).set(&position);
        } else {
            // Mevcut pozisyonu güncelle
            let mut position = self.stake_positions(caller.clone()).get();
            
            // Önce ödülleri hesapla
            let rewards = self.calculate_rewards(&position);
            position.rewards += rewards;
            
            // Yeni stake miktarını ekle
            position.staked_amount += payment;
            position.last_stake_timestamp = current_timestamp;
            
            self.stake_positions(caller).set(&position);
        }

        // Stake event'ini tetikle
        self.emit_stake_event(&caller, &payment);
    }

    // EGLD unstake başlatma
    #[endpoint]
    fn request_unstake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        require!(
            self.stake_positions(caller.clone()).is_empty() == false,
            "No stake position found"
        );

        let mut position = self.stake_positions(caller.clone()).get();
        require!(
            amount <= position.staked_amount,
            "Unstake amount exceeds staked amount"
        );

        // Ödülleri hesapla
        let rewards = self.calculate_rewards(&position);
        position.rewards += rewards;
        
        // Unstake zamanını ayarla
        position.unstake_timestamp = self.blockchain().get_block_timestamp();
        position.staked_amount -= &amount;
        
        self.stake_positions(caller.clone()).set(&position);
        
        // Unstake request event'ini tetikle
        self.emit_unstake_request_event(&caller, &amount);
    }

    // EGLD unstake tamamlama
    #[endpoint]
    fn complete_unstake(&self) {
        let caller = self.blockchain().get_caller();
        require!(
            self.stake_positions(caller.clone()).is_empty() == false,
            "No stake position found"
        );

        let position = self.stake_positions(caller.clone()).get();
        let current_timestamp = self.blockchain().get_block_timestamp();
        
        require!(
            position.unstake_timestamp > 0,
            "No unstake request found"
        );
        require!(
            current_timestamp >= position.unstake_timestamp + self.unstake_period().get(),
            "Unstake period not completed"
        );

        // EGLD'yi geri gönder
        self.send().direct_egld(
            &caller,
            &position.staked_amount,
        );

        // Pozisyonu sil
        self.stake_positions(caller.clone()).clear();
        
        // Unstake complete event'ini tetikle
        self.emit_unstake_complete_event(&caller, &position.staked_amount);
    }

    // Ödülleri talep etme
    #[endpoint]
    fn claim_rewards(&self) {
        let caller = self.blockchain().get_caller();
        require!(
            self.stake_positions(caller.clone()).is_empty() == false,
            "No stake position found"
        );

        let mut position = self.stake_positions(caller.clone()).get();
        
        // Ödülleri hesapla
        let rewards = self.calculate_rewards(&position);
        position.rewards += rewards;
        
        require!(
            position.rewards > 0,
            "No rewards to claim"
        );

        // Ödülleri gönder
        self.send().direct_egld(
            &caller,
            &position.rewards,
        );

        // Ödülleri sıfırla
        position.rewards = BigUint::zero();
        position.last_stake_timestamp = self.blockchain().get_block_timestamp();
        
        self.stake_positions(caller.clone()).set(&position);
        
        // Claim rewards event'ini tetikle
        self.emit_claim_rewards_event(&caller, &rewards);
    }

    // Görüntüleme fonksiyonları
    #[view(getStakePosition)]
    fn get_stake_position(&self, address: ManagedAddress) -> Option<StakePosition<Self::Api>> {
        if self.stake_positions(address.clone()).is_empty() {
            None
        } else {
            Some(self.stake_positions(address).get())
        }
    }

    // Yardımcı fonksiyonlar
    fn calculate_rewards(&self, position: &StakePosition<Self::Api>) -> BigUint {
        let current_timestamp = self.blockchain().get_block_timestamp();
        let time_staked = current_timestamp - position.last_stake_timestamp;
        
        // Yıllık ödül oranını günlük bazda hesapla
        let daily_rate = self.reward_rate().get() / BigUint::from(365u64);
        let reward = &position.staked_amount * daily_rate * BigUint::from(time_staked) 
            / BigUint::from(24u64 * 60u64 * 60u64 * 100u64);
            
        reward
    }

    // Event'ler
    #[event("stake")]
    fn emit_stake_event(&self, address: &ManagedAddress, amount: &BigUint);

    #[event("unstakeRequest")]
    fn emit_unstake_request_event(&self, address: &ManagedAddress, amount: &BigUint);

    #[event("unstakeComplete")]
    fn emit_unstake_complete_event(&self, address: &ManagedAddress, amount: &BigUint);

    #[event("claimRewards")]
    fn emit_claim_rewards_event(&self, address: &ManagedAddress, amount: &BigUint);

    // Storage
    #[storage_mapper("stakePositions")]
    fn stake_positions(&self, address: ManagedAddress) -> SingleValueMapper<StakePosition<Self::Api>>;

    #[storage_mapper("rewardRate")]
    fn reward_rate(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("minimumStakeAmount")]
    fn minimum_stake_amount(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("unstakePeriod")]
    fn unstake_period(&self) -> SingleValueMapper<u64>;
} 