
export interface SessionInterface {
    id?: string;
    profileId: string;
    createdAt: Date;
    updatedAt: Date;
    appName: string;
    isActive: boolean;
}
