export const UserLevelEnum = {
    LEVEL_1: 1,
    LEVEL_2: 2,
    LEVEL_3: 3,
    LEVEL_4: 4,
    LEVEL_5: 5
} as const;

export type UserLevelEnum = typeof UserLevelEnum[keyof typeof UserLevelEnum];

export interface IUser {
    username: string;
    level: UserLevelEnum;
    currentXp: number;
}
