#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// Structure for multi-asset support
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct TokenAmount<M: ManagedTypeApi> {
    pub token_identifier: TokenIdentifier<M>,
    pub amount: BigUint<M>,
}

// Oracle data structure
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct OracleCondition<M: ManagedTypeApi> {
    pub oracle_address: ManagedAddress<M>,
    pub data_key: ManagedBuffer<M>,
    pub expected_value: ManagedBuffer<M>,
}

// Enum to track trade status
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq)]
pub enum OfferStatus {
    Active,
    Completed,
    Cancelled,
    Expired
}

// Enhanced Offer structure
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Offer<M: ManagedTypeApi> {
    pub offer_id: u64,
    pub creator: ManagedAddress<M>,
    pub recipient: ManagedAddress<M>,
    // Multi-token support
    pub offered_tokens: ManagedVec<M, TokenAmount<M>>,
    pub expected_tokens: ManagedVec<M, TokenAmount<M>>,
    pub creation_timestamp: u64,
    pub expiration_timestamp: u64,
    pub status: OfferStatus,
    pub platform_fee: BigUint<M>,
    // Oracle conditions
    pub oracle_conditions: Option<ManagedVec<M, OracleCondition<M>>>,
}

#[multiversx_sc::contract]
pub trait TokenEscrow {
    #[init]
    fn init(&self) {
        self.platform_fee_percentage().set(&BigUint::from(1u64)); // 1% platform fee
        self.owner().set(&self.blockchain().get_caller());
        self.offer_id_counter().set(&0u64);
    }

    // Storage for platform owner
    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    // Storage for platform fee percentage
    #[storage_mapper("platformFeePercentage")]
    fn platform_fee_percentage(&self) -> SingleValueMapper<BigUint>;

    // Total transaction counter
    #[storage_mapper("offerIdCounter")]
    fn offer_id_counter(&self) -> SingleValueMapper<u64>;

    // Create offer with multi-token support
    #[payable("*")]
    #[endpoint]
    fn create_offer(
        &self,
        recipient: ManagedAddress,
        expected_tokens: MultiValueEncoded<MultiValue2<TokenIdentifier, BigUint>>,
        expiration_timestamp: u64,
        oracle_conditions: OptionalValue<MultiValueEncoded<MultiValue3<ManagedAddress, ManagedBuffer, ManagedBuffer>>>,
    ) {
        let payments = self.call_value().all_esdt_transfers();
        let caller = self.blockchain().get_caller();
        let current_timestamp = self.blockchain().get_block_timestamp();

        require!(
            expiration_timestamp > current_timestamp,
            "Expiration time must be in the future"
        );

        // Create offered tokens
        let mut offered_tokens = ManagedVec::new();
        for payment in payments.into_iter() {
            offered_tokens.push(TokenAmount {
                token_identifier: payment.token_identifier,
                amount: payment.amount,
            });
        }

        // Create expected tokens
        let mut expected_tokens = ManagedVec::new();
        for token in expected_tokens.into_iter() {
            let (token_id, amount) = token.into_tuple();
            expected_tokens.push(TokenAmount {
                token_identifier: token_id,
                amount,
            });
        }

        // Create oracle conditions
        let oracle_conditions = if let OptionalValue::Some(conditions) = oracle_conditions {
            let mut conditions_vec = ManagedVec::new();
            for condition in conditions.into_iter() {
                let (oracle_address, data_key, expected_value) = condition.into_tuple();
                conditions_vec.push(OracleCondition {
                    oracle_address,
                    data_key,
                    expected_value,
                });
            }
            Some(conditions_vec)
        } else {
            None
        };

        // Calculate platform fee
        let fee_percentage = self.platform_fee_percentage().get();
        let mut total_fee = BigUint::zero();
        for token in offered_tokens.iter() {
            let fee = &token.amount * &fee_percentage / BigUint::from(100u64);
            total_fee += fee;
        }

        let offer_id = self.offer_id_counter().get() + 1;
        self.offer_id_counter().set(&offer_id);

        let offer = Offer {
            offer_id,
            creator: caller,
            recipient,
            offered_tokens,
            expected_tokens,
            creation_timestamp: current_timestamp,
            expiration_timestamp,
            status: OfferStatus::Active,
            platform_fee: total_fee,
            oracle_conditions,
        };

        self.offers().push(&offer);
        self.emit_offer_created_event(&offer);
    }

    #[endpoint]
    fn cancel_offer(&self, offer_id: u64) {
        let caller = self.blockchain().get_caller();
        let offer_index = self.get_offer_index_by_id(offer_id);
        let mut offer = self.offers().get(offer_index);
        
        require!(
            offer.status == OfferStatus::Active,
            "Offer is not active"
        );
        require!(
            offer.creator == caller,
            "Only creator can cancel offer"
        );
        
        // Return process

        for token in offer.offered_tokens.iter() {
            self.send().direct_esdt(
                &offer.creator,
                &token.token_identifier,
                0,
                &(&token.amount - &offer.platform_fee),
            );
        }
        
        offer.status = OfferStatus::Cancelled;
        self.offers().set(offer_index, &offer);
        self.emit_offer_cancelled_event(&offer);
    }

    #[payable("*")]
    #[endpoint]
    fn accept_offer(&self, offer_id: u4) {
        let payments = self.call_value().all_esdt_transfers();
        let caller = self.blockchain().get_caller();
        let offer_index = self.get_offer_index_by_id(offer_id);
        let mut offer = self.offers().get(offer_index);
        
        require!(
            offer.status == OfferStatus::Active,
            "Offer is not active"
        );
        require!(
            offer.recipient == caller,
            "Only recipient can accept offer"
        );
        require!(
            self.blockchain().get_block_timestamp() <= offer.expiration_timestamp,
            "Offer has expired"
        );

        //Check Oracle conditions

        if let Some(conditions) = &offer.oracle_conditions {
            for condition in conditions.iter() {
                self.check_oracle_condition(&condition);
            }
        }

        // Token transfers

        for token in offer.offered_tokens.iter() {
            self.send().direct_esdt(
                &offer.recipient,
                &token.token_identifier,
                0,
                &(&token.amount - &offer.platform_fee),
            );
        }

        for payment in payments.iter() {
            self.send().direct_esdt(
                &offer.creator,
                &payment.token_identifier,
                0,
                &payment.amount,
            );
        }
        
        offer.status = OfferStatus::Completed;
        self.offers().set(offer_index, &offer);
        self.emit_offer_completed_event(&offer);
    }

    // Check Oracle condition

    fn check_oracle_condition(&self, condition: &OracleCondition<Self::Api>) {
        let result = self.blockchain().execute_on_dest_context_raw(
            &condition.oracle_address,
            self.blockchain().get_gas_left(),
            &BigUint::zero(),
            &condition.data_key.into_bytes(),
        );

        require!(
            result == condition.expected_value.into_bytes(),
            "Oracle condition not met"
        );
    }

    // Clear expired offers

    #[endpoint]
    fn cleanup_expired_offers(&self) {
        let current_timestamp = self.blockchain().get_block_timestamp();
        let mut i = 0;
        
        while i < self.offers().len() {
            let mut offer = self.offers().get(i);
            
            if offer.status == OfferStatus::Active && 
               offer.expiration_timestamp < current_timestamp {
                offer.status = OfferStatus::Expired;
                
                // Return tokens

                for token in offer.offered_tokens.iter() {
                    self.send().direct_esdt(
                        &offer.creator,
                        &token.token_identifier,
                        0,
                        &(&token.amount - &offer.platform_fee),
                    );
                }
                
                self.offers().set(i, &offer);
                self.emit_offer_expired_event(&offer);
            }
            
            i += 1;
        }
    }

    // Auxiliary functions

    fn get_offer_index_by_id(&self, offer_id: u64) -> usize {
        for (index, offer) in self.offers().iter().enumerate() {
            if offer.offer_id == offer_id {
                return index;
            }
        }
        sc_panic!("Offer not found");
    }

    // Functions for owner only

    #[only_owner]
    #[endpoint(setFeePercentage)]
    fn set_fee_percentage(&self, new_percentage: BigUint) {
        require!(
            new_percentage <= BigUint::from(5u64),
            "Fee percentage cannot exceed 5%"
        );
        self.platform_fee_percentage().set(&new_percentage);
    }

    // Display functions

    #[view(getOfferById)]
    fn get_offer_by_id(&self, offer_id: u64) -> Option<Offer<Self::Api>> {
        for offer in self.offers().iter() {
            if offer.offer_id == offer_id {
                return Some(offer);
            }
        }
        None
    }

    #[view(getActiveOffers)]
    fn get_active_offers(&self) -> MultiValueEncoded<Offer<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        for offer in self.offers().iter() {
            if offer.status == OfferStatus::Active 
               && offer.expiration_timestamp > self.blockchain().get_block_timestamp() {
                result.push(offer);
            }
        }
        result
    }

    // events

    #[event("offerCreated")]
    fn emit_offer_created_event(&self, offer: &Offer<Self::Api>);

    #[event("offerCancelled")]
    fn emit_offer_cancelled_event(&self, offer: &Offer<Self::Api>);

    #[event("offerCompleted")]
    fn emit_offer_completed_event(&self, offer: &Offer<Self::Api>);

    #[event("offerExpired")]
    fn emit_offer_expired_event(&self, offer: &Offer<Self::Api>);

    // Storage
    #[storage_mapper("offers")]
    fn offers(&self) -> VecMapper<Offer<Self::Api>>;
} 
