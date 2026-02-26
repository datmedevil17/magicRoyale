use anchor_lang::prelude::*;
use instructions::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("EYYaUKGcq2epXWsXk52P7dEXpDMZQpGdkSXVDypzDhYm");

#[ephemeral_rollups_sdk::anchor::ephemeral]
#[program]
pub mod game_core {
    use super::*;

    // Player
    pub fn initialize_player(ctx: Context<InitializePlayer>, username: String) -> Result<()> {
        instructions::player::initialize_player(ctx, username)
    }

    pub fn unlock_card(ctx: Context<ManageCard>, card_id: u8) -> Result<()> {
        instructions::player::unlock_card(ctx, card_id)
    }

    pub fn upgrade_card(ctx: Context<ManageCard>, card_id: u8) -> Result<()> {
        instructions::player::upgrade_card(ctx, card_id)
    }

    pub fn set_deck(ctx: Context<ManageCard>, new_deck: [u8; 8]) -> Result<()> {
        instructions::player::set_deck(ctx, new_deck)
    }

    // Battle - Game Lobby
    pub fn create_game(ctx: Context<CreateGame>, game_id: u64) -> Result<()> {
        instructions::battle::create_game(ctx, game_id)
    }

    pub fn join_game(ctx: Context<JoinGame>, game_id: u64) -> Result<()> {
        instructions::battle::join_game(ctx, game_id)
    }

    // Battle - Delegation
    pub fn delegate_game(ctx: Context<DelegateGame>, game_id: u64) -> Result<()> {
        instructions::battle::delegate_game(ctx, game_id)
    }

    // Battle - Gameplay (on ER)
    pub fn deploy_troop(ctx: Context<DeployTroop>, game_id: u64, card_idx: u8, x: i32, y: i32) -> Result<()> {
        instructions::battle::deploy_troop(ctx, game_id, card_idx, x, y)
    }

    // Battle - End Game (on ER)
    pub fn end_game(ctx: Context<EndGame>, game_id: u64, winner_idx: u8) -> Result<()> {
        instructions::battle::end_game(ctx, game_id, winner_idx)
    }

    // Battle - Commit to Base Layer
    pub fn commit_battle(ctx: Context<CommitBattle>, game_id: u64) -> Result<()> {
        instructions::battle::commit_battle(ctx, game_id)
    }

    // Battle - Rewards (on base layer)
    pub fn mint_trophies(ctx: Context<MintTrophies>, game_id: u64) -> Result<()> {
        instructions::battle::mint_trophies(ctx, game_id)
    }

    // Resources
    pub fn export_resource(ctx: Context<ExportResource>, card_id: u8, amount: u32) -> Result<()> {
        instructions::resources::export_resource(ctx, card_id, amount)
    }

    pub fn import_resource(ctx: Context<ImportResource>, card_id: u8, amount: u32) -> Result<()> {
        instructions::resources::import_resource(ctx, card_id, amount)
    }

    pub fn export_nft(ctx: Context<ExportNft>, card_id: u8) -> Result<()> {
        instructions::resources::export_nft(ctx, card_id)
    }

    // Clans
    pub fn create_clan(ctx: Context<CreateClan>, name: String) -> Result<()> {
        instructions::clans::create_clan(ctx, name)
    }

    pub fn join_clan(ctx: Context<JoinClan>) -> Result<()> {
        instructions::clans::join_clan(ctx)
    }

    pub fn request_cards(ctx: Context<RequestCards>, card_id: u8) -> Result<()> {
        instructions::clans::request_cards(ctx, card_id)
    }

    pub fn donate_cards(ctx: Context<DonateCards>) -> Result<()> {
        instructions::clans::donate_cards(ctx)
    }
}
