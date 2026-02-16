use anchor_lang::prelude::*;
use instructions::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("HDYw4gNvVqjCL4c9Er3RfnhuA5tNPPmoHpgyVsDumiWM");

#[ephemeral_rollups_sdk::anchor::ephemeral]
#[program]
pub mod counter {
    use super::*;

    // Player
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        instructions::player::initialize_player(ctx)
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

    // Battle
    pub fn initialize_game(ctx: Context<InitializeGame>, opponent: Pubkey) -> Result<()> {
        instructions::battle::initialize_game(ctx, opponent)
    }

    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        instructions::battle::delegate(ctx)
    }

    pub fn deploy_troop(ctx: Context<UpdateBattle>, card_idx: u8, x: i32, y: i32) -> Result<()> {
        instructions::battle::deploy_troop(ctx, card_idx, x, y)
    }

    pub fn game_tick(ctx: Context<UpdateBattle>) -> Result<()> {
        instructions::battle::game_tick(ctx)
    }

    pub fn resolve_game(ctx: Context<ResolveGame>) -> Result<()> {
        instructions::battle::resolve_game(ctx)
    }

    pub fn commit_battle(ctx: Context<CommitBattle>) -> Result<()> {
        instructions::battle::commit_battle(ctx)
    }

    pub fn undelegate_battle(ctx: Context<CommitBattle>) -> Result<()> {
        instructions::battle::undelegate_battle(ctx)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::battle::claim_rewards(ctx)
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

    // Economy
    pub fn deposit_gold(ctx: Context<DepositGold>, amount: u64) -> Result<()> {
        instructions::economy::deposit_gold(ctx, amount)
    }

    pub fn withdraw_gold(ctx: Context<WithdrawGold>, amount: u64) -> Result<()> {
        instructions::economy::withdraw_gold(ctx, amount)
    }
}
