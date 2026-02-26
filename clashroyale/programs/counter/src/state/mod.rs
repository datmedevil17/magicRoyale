pub mod clans;
pub use clans::*;

use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub authority: Pubkey,
    pub mmr: u32,
    pub deck: [u8; 8],
    #[max_len(MAX_INVENTORY)]
    pub inventory: Vec<CardProgress>,
    #[max_len(20)]
    pub username: String,
    pub trophies: u32,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct CardProgress {
    pub card_id: u8,
    pub level: u8,
    pub xp: u16,
    pub amount: u32,
}

#[account]
#[derive(InitSpace)]
pub struct CardMintState {
    pub card_id: u8,
    pub level: u8,
    pub xp: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BattleState {
    pub game_id: u64,
    pub players: [Pubkey; 2],
    pub status: GameStatus,
    pub tick_count: u64,
    pub elixir: [u64; 2],
    pub towers: [Tower; 6],
    #[max_len(MAX_ENTITIES)]
    pub entities: Vec<Entity>,
    pub winner: Option<u8>,
    pub trophies_minted: bool,
    /// How many of the enemy's towers each player has destroyed (princess only)
    pub towers_destroyed: [u8; 2],
    /// Total HP damage dealt to enemy towers by each player
    pub damage_dealt: [u64; 2],
    pub last_update_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Eq)]
pub enum GameStatus {
    Waiting,
    Active,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct Tower {
    pub health: i32,
    pub x: i32,
    pub y: i32,
    pub owner_idx: u8,
    pub is_king: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub struct Entity {
    pub id: u32,
    pub owner_idx: u8,
    pub card_id: u8,
    pub x: i32,
    pub y: i32,
    pub health: i32,
    pub damage: i32,
    pub state: EntityState,
    pub target_id: Option<u32>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Debug)]
pub enum EntityState {
    Idle,
    Moving,
    Attacking,
    Dead
}

pub struct CardBaseStats {
    pub cost: u8,
    pub health: i32,
    pub damage: i32
}

pub fn get_card_stats(id: u8) -> Option<CardBaseStats> {
    match id {
        1 => Some(CardBaseStats { cost: 3, health: 125, damage: 33 }), // Archer 
        2 => Some(CardBaseStats { cost: 5, health: 2000, damage: 126 }), // Giant
        3 => Some(CardBaseStats { cost: 4, health: 600, damage: 325 }), // MiniPEKKA
        _ => Some(CardBaseStats { cost: 3, health: 100, damage: 100 })
    }
}
