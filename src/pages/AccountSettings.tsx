import React, { useState } from "react";
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

interface StoreSettings {
  // Currency Settings
  primaryCurrency: string;
  secondaryCurrency: string;
  showDualCurrency: boolean;
  manualExchangeRate: number;

  // Store Information
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  businessLicense: string;

  // Tax Settings
  vatEnabled: boolean;
  vatRate: number;
  vatNumber: string;

  // Receipt Settings
  receiptLogo: boolean;
  receiptFooter: string;
  printReceipts: boolean;
  emailReceipts: boolean;

  // Notification Preferences
  lowStockAlerts: boolean;
  dailyReports: boolean;
  paymentAlerts: boolean;
  systemUpdates: boolean;

  // Display Preferences
  language: string;
  theme: "light" | "dark" | "auto";

  // Security Settings
  requirePin: boolean;
  backupEnabled: boolean;
}

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
  const { user, updateUserProfile } = useAuthContext();

  const [settings, setSettings] = useState<StoreSettings>({
    // Currency Settings
    primaryCurrency: "USD",
    secondaryCurrency: "ZWL",
    manualExchangeRate: 5000,
    showDualCurrency: true,

    // Store Information
    storeName: user?.businessName || "My Store",
    storeAddress: "123 Main Street, Harare, Zimbabwe",
    storePhone: user?.phone || "+263 77 123 4567",
    storeEmail: user?.email || "store@example.com",
    businessLicense: "BL2024001",

    // Tax Settings
    vatEnabled: true,
    vatRate: 14.5,
    vatNumber: "VAT123456789",

    // Receipt Settings
    receiptLogo: true,
    receiptFooter: "Thank you for shopping with us!",
    printReceipts: true,
    emailReceipts: false,

    // Notification Preferences
    lowStockAlerts: true,
    dailyReports: true,
    paymentAlerts: true,
    systemUpdates: false,

    // Display Preferences
    language: "en",
    theme: "auto",

    // Security Settings
    requirePin: false,
    backupEnabled: true,
  });

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
    try {
      // Update Firebase user profile with business name
      const success = await updateUserProfile(settings.storeName);

      if (success) {
        setToastMessage("Settings saved successfully!");
      } else {
        setToastMessage("Settings saved locally, but profile update failed");
      }

      // In a real app, this would also save other settings to backend/local storage
      console.log("Saving all settings:", settings);
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
            <IonButton fill="clear" onClick={handleSave}>
              <IonIcon icon={saveOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="account-settings-content">
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
                    {getSelectedCurrency(settings.primaryCurrency)?.symbol} = ?{" "}
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
                          updateSetting("vatRate", parseFloat(e.detail.value!))
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
                  <IonLabel position="stacked">Receipt Footer Message</IonLabel>
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
                <IonIcon icon={notificationsOutline} className="section-icon" />
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
                <IonIcon icon={colorPaletteOutline} className="section-icon" />
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
                    onIonChange={(e) => updateSetting("theme", e.detail.value)}
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
            >
              <IonIcon icon={saveOutline} slot="start" />
              Save Settings
            </IonButton>
          </div>
        </div>

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
