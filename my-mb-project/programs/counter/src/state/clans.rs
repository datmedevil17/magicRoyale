use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Clan {
    #[max_len(32)]
    pub name: String,
    pub leader: Pubkey,
    pub member_count: u8,
    pub min_trophies: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ClanMember {
    pub clan: Pubkey,
    pub player: Pubkey,
    pub role: ClanRole,
    pub last_request_time: i64,
    pub donations_given: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Eq)]
pub enum ClanRole {
    Member,
    Elder,
    CoLeader,
    Leader,
}

#[account]
#[derive(InitSpace)]
pub struct DonationRequest {
    pub clan: Pubkey,
    pub player: Pubkey,
    pub card_id: u8,
    pub amount_needed: u8,
    pub amount_filled: u8,
    pub is_active: bool,
    pub bump: u8,
}
