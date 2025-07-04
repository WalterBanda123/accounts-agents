import React, { useState, useEffect } from "react";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonToggle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonTextarea,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import {
  saveOutline,
  businessOutline,
  cardOutline,
  receiptOutline,
  notificationsOutline,
  shieldCheckmarkOutline,
  colorPaletteOutline,
} from "ionicons/icons";
import "./AccountSettings.css";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { StoreSettings } from "../interfaces/store";
import settingsService from "../services/settingsService";
import { migrateLocalStorageSettings } from "../utils/settingsInitializer";

const CURRENCIES = [
  { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "BWP", name: "Botswana Pula", symbol: "P" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "sn", name: "Shona" },
  { code: "nd", name: "Ndebele" },
];

const AccountSettings: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { user, updateUserProfile, isLoading } = useAuthContext();

  const [settings, setSettings] = useState<StoreSettings>(
    settingsService.getDefaultSettings(user || undefined)
  );

  // Load existing settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingSettings(true);

        // Try to migrate from localStorage first
        await migrateLocalStorageSettings(user.id);

        // Get settings with fallback to backup
        const existingSettings =
          await settingsService.getStoreSettingsWithFallback(user.id);

        if (existingSettings) {
          setSettings(existingSettings);
        } else {
          // Create initial settings for new user
          const defaultSettings = settingsService.getDefaultSettings(
            user || undefined
          );
          setSettings(defaultSettings);

          // Save default settings to database
          await settingsService.createStoreSettings(user.id, defaultSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setToastMessage("Error loading settings. Using defaults.");
        setShowToast(true);

        // Fallback to default settings
        setSettings(settingsService.getDefaultSettings(user || undefined));
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSetting = (
    key: keyof StoreSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      setToastMessage("User not authenticated");
      setShowToast(true);
      return;
    }

    try {
      // Use enhanced save method with validation
      const saveResult =
        await settingsService.updateStoreSettingsWithValidation(
          user.id,
          settings
        );

      if (saveResult.success) {
        // Update Firebase user profile with business name (for backward compatibility)
        const profileSuccess = await updateUserProfile(settings.storeName);

        if (profileSuccess) {
          setToastMessage("Settings saved successfully!");
        } else {
          setToastMessage("Settings saved, but profile update had issues");
        }
      } else {
        // Show validation errors
        const errorMessage =
          saveResult.errors?.join(", ") || "Error saving settings";
        setToastMessage(errorMessage);
      }
    } catch (error) {
      console.error("Save error:", error);
      setToastMessage("Error saving settings");
    }

    setShowToast(true);
  };

  const getSelectedCurrency = (code: string) => {
    return CURRENCIES.find((c) => c.code === code);
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Account Settings</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <IonSpinner
                  name="circular"
                  style={{ width: "20px", height: "20px" }}
                />
              ) : (
                <IonIcon icon={saveOutline} />
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="account-settings-content">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        {isLoadingSettings ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <IonSpinner name="circular" />
          </div>
        ) : (
          <div className="settings-container">
            {/* Currency Settings */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={cardOutline} className="section-icon" />
                  Currency Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel position="stacked">Primary Currency</IonLabel>
                    <IonSelect
                      value={settings.primaryCurrency}
                      onIonChange={(e) =>
                        updateSetting("primaryCurrency", e.detail.value)
                      }
                    >
                      {CURRENCIES.map((currency) => (
                        <IonSelectOption
                          key={currency.code}
                          value={currency.code}
                        >
                          {currency.name} ({currency.symbol})
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Secondary Currency</IonLabel>
                    <IonSelect
                      value={settings.secondaryCurrency}
                      onIonChange={(e) =>
                        updateSetting("secondaryCurrency", e.detail.value)
                      }
                    >
                      {CURRENCIES.map((currency) => (
                        <IonSelectOption
                          key={currency.code}
                          value={currency.code}
                        >
                          {currency.name} ({currency.symbol})
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel>Show Dual Currency Pricing</IonLabel>
                    <IonToggle
                      checked={settings.showDualCurrency}
                      onIonChange={(e) =>
                        updateSetting("showDualCurrency", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      Exchange Rate (1{" "}
                      {getSelectedCurrency(settings.primaryCurrency)?.symbol} =
                      ?{" "}
                      {getSelectedCurrency(settings.secondaryCurrency)?.symbol})
                    </IonLabel>
                    <IonInput
                      type="number"
                      value={settings.manualExchangeRate}
                      onIonInput={(e) =>
                        updateSetting(
                          "manualExchangeRate",
                          parseFloat(e.detail.value!)
                        )
                      }
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Store Information */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={businessOutline} className="section-icon" />
                  Store Information
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel position="stacked">Store Name</IonLabel>
                    <IonInput
                      value={settings.storeName}
                      onIonInput={(e) =>
                        updateSetting("storeName", e.detail.value!)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Address</IonLabel>
                    <IonTextarea
                      value={settings.storeAddress}
                      onIonInput={(e) =>
                        updateSetting("storeAddress", e.detail.value!)
                      }
                      rows={3}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Phone Number</IonLabel>
                    <IonInput
                      value={settings.storePhone}
                      onIonInput={(e) =>
                        updateSetting("storePhone", e.detail.value!)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={settings.storeEmail}
                      onIonInput={(e) =>
                        updateSetting("storeEmail", e.detail.value!)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      Business License Number
                    </IonLabel>
                    <IonInput
                      value={settings.businessLicense}
                      onIonInput={(e) =>
                        updateSetting("businessLicense", e.detail.value!)
                      }
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Tax Settings */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={receiptOutline} className="section-icon" />
                  Tax Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel>Enable VAT</IonLabel>
                    <IonToggle
                      checked={settings.vatEnabled}
                      onIonChange={(e) =>
                        updateSetting("vatEnabled", e.detail.checked)
                      }
                    />
                  </IonItem>

                  {settings.vatEnabled && (
                    <>
                      <IonItem>
                        <IonLabel position="stacked">VAT Rate (%)</IonLabel>
                        <IonInput
                          type="number"
                          value={settings.vatRate}
                          onIonInput={(e) =>
                            updateSetting(
                              "vatRate",
                              parseFloat(e.detail.value!)
                            )
                          }
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">VAT Number</IonLabel>
                        <IonInput
                          value={settings.vatNumber}
                          onIonInput={(e) =>
                            updateSetting("vatNumber", e.detail.value!)
                          }
                        />
                      </IonItem>
                    </>
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Receipt Settings */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={receiptOutline} className="section-icon" />
                  Receipt Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel>Include Logo on Receipts</IonLabel>
                    <IonToggle
                      checked={settings.receiptLogo}
                      onIonChange={(e) =>
                        updateSetting("receiptLogo", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Auto-print Receipts</IonLabel>
                    <IonToggle
                      checked={settings.printReceipts}
                      onIonChange={(e) =>
                        updateSetting("printReceipts", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Email Receipts to Customers</IonLabel>
                    <IonToggle
                      checked={settings.emailReceipts}
                      onIonChange={(e) =>
                        updateSetting("emailReceipts", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">
                      Receipt Footer Message
                    </IonLabel>
                    <IonTextarea
                      value={settings.receiptFooter}
                      onIonInput={(e) =>
                        updateSetting("receiptFooter", e.detail.value!)
                      }
                      rows={2}
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Notification Preferences */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon
                    icon={notificationsOutline}
                    className="section-icon"
                  />
                  Notifications
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel>Low Stock Alerts</IonLabel>
                    <IonToggle
                      checked={settings.lowStockAlerts}
                      onIonChange={(e) =>
                        updateSetting("lowStockAlerts", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Daily Sales Reports</IonLabel>
                    <IonToggle
                      checked={settings.dailyReports}
                      onIonChange={(e) =>
                        updateSetting("dailyReports", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Payment Alerts</IonLabel>
                    <IonToggle
                      checked={settings.paymentAlerts}
                      onIonChange={(e) =>
                        updateSetting("paymentAlerts", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>System Updates</IonLabel>
                    <IonToggle
                      checked={settings.systemUpdates}
                      onIonChange={(e) =>
                        updateSetting("systemUpdates", e.detail.checked)
                      }
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Display Preferences */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon
                    icon={colorPaletteOutline}
                    className="section-icon"
                  />
                  Display & Language
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel position="stacked">Language</IonLabel>
                    <IonSelect
                      value={settings.language}
                      onIonChange={(e) =>
                        updateSetting("language", e.detail.value)
                      }
                    >
                      {LANGUAGES.map((lang) => (
                        <IonSelectOption key={lang.code} value={lang.code}>
                          {lang.name}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Theme</IonLabel>
                    <IonSelect
                      value={settings.theme}
                      onIonChange={(e) =>
                        updateSetting("theme", e.detail.value)
                      }
                    >
                      <IonSelectOption value="light">Light</IonSelectOption>
                      <IonSelectOption value="dark">Dark</IonSelectOption>
                      <IonSelectOption value="auto">
                        Auto (System)
                      </IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Security & Backup */}
            <IonCard className="settings-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    className="section-icon"
                  />
                  Security & Backup
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem>
                    <IonLabel>Require PIN to Access</IonLabel>
                    <IonToggle
                      checked={settings.requirePin}
                      onIonChange={(e) =>
                        updateSetting("requirePin", e.detail.checked)
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Enable Data Backup</IonLabel>
                    <IonToggle
                      checked={settings.backupEnabled}
                      onIonChange={(e) =>
                        updateSetting("backupEnabled", e.detail.checked)
                      }
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Save Button */}
            <div className="save-section">
              <IonButton
                expand="block"
                fill="solid"
                onClick={handleSave}
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <IonSpinner
                      name="circular"
                      style={{ marginRight: "8px" }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <IonIcon icon={saveOutline} slot="start" />
                    Save Settings
                  </>
                )}
              </IonButton>
            </div>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default AccountSettings;
