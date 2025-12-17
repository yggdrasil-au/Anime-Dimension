// Types for user page logic

export type Dict = Record<string, unknown>;

export type WatchStats = {
    watched: number;
    watching: number;
    want: number;
    stalled: number;
    dropped: number;
    wont: number;
};

export type RatingsMap = Record<string, number>;

export type UserProfile = {
    user_id: string;
    user_name: string;
    avatar_url?: string;
    banner_url?: string;
    joined_at?: string;
    watch_minutes?: number;
    stats?: WatchStats;
    ratings?: RatingsMap;
    ratings_total?: number;
};

export type LoginState = {
    user_id: string;
    user_name: string;
};

