export interface UserInterface {
    id: string,
    name: string,
    email: string,
    businessName: string,
    phone: string,
    profileImage: string
}

export interface UserProfile {
    user_id: string;                     // Firebase Auth UID
    name: string;
    email: string;
    phone?: string;

    // Preferences
    language_preference: 'English' | 'Shona' | 'Ndebele';
    preferred_currency: 'USD' | 'ZIG' | 'ZWL';

    // Location
    country: string;
    city?: string;
    location?: string;

    // Business Information
    business_owner: boolean;
    business_profile?: {
        industry: string;                  // 'grocery', 'pharmacy', etc.
        business_size: 'small' | 'medium' | 'large';
        years_in_business?: number;
        main_products?: string[];
    };

    // Avatar
    avatar?: {
        color: string;                     // Hex color for avatar background
        initials: string;                  // Generated from name/store name
    };

    // System Fields
    created_at: string;
    updated_at: string;
    last_active?: string;
    status: 'active' | 'inactive';
}