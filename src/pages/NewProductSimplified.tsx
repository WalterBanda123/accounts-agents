import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonToast,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonFooter,
  IonSpinner,
  IonActionSheet,
  IonItem,
  IonLabel,
} from "@ionic/react";
import {
  saveOutline,
  cameraOutline,
  imagesOutline,
  sparklesOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { StockItem } from "../mock/stocks";
import ProfilePopover from "../components/ProfilePopover";
import { useDataContext } from "../contexts/data/UseDataContext";
import "./NewProduct.css";

interface LocationState {
  editMode?: boolean;
  productData?: StockItem;
}

const NewProduct: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const isEditMode = location.state?.editMode || false;
  const existingProduct = location.state?.productData;
  const { addNewProduct, isProductsLoading, askAiAssistant, currentSessionId } =
    useDataContext();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    unitPrice: "",
    quantity: "",
    unit: "pieces",
    brand: "",
    size: "",
    supplier: "",
    barcode: "",
    imageUrl: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageProcessingSuccess, setImageProcessingSuccess] = useState(false);
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);

  // Simplified categories
  const categories = [
    {
      value: "Food",
      subcategories: ["Snacks", "Canned Goods", "Grains & Rice", "Condiments"],
    },
    {
      value: "Beverages",
      subcategories: ["Soft Drinks", "Juices", "Water", "Tea & Coffee"],
    },
    {
      value: "Dairy",
      subcategories: ["Milk", "Cheese", "Yogurt", "Butter"],
    },
    {
      value: "Household",
      subcategories: ["Cleaning", "Personal Care", "Paper Products"],
    },
    {
      value: "Health & Beauty",
      subcategories: ["Vitamins", "Skincare", "Hair Care"],
    },
  ];

  const units = [
    "pieces",
    "kg",
    "g",
    "liters",
    "ml",
    "bottles",
    "cans",
    "packs",
  ];

  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        name: existingProduct.name,
        description: existingProduct.description,
        category: existingProduct.category,
        subcategory: existingProduct.subcategory,
        unitPrice: existingProduct.unitPrice.toString(),
        quantity: existingProduct.quantity.toString(),
        unit: existingProduct.unit,
        brand: existingProduct.brand,
        size: existingProduct.size,
        supplier: existingProduct.supplier,
        barcode: existingProduct.barcode || "",
        imageUrl: existingProduct.image || "",
      });
      if (existingProduct.image) {
        setCapturedImage(existingProduct.image);
      }
    }
  }, [isEditMode, existingProduct]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category,
      subcategory: "",
    }));
  };

  const getSubcategories = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === formData.category
    );
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  const validateForm = () => {
    const required = [
      "name",
      "category",
      "subcategory",
      "brand",
      "supplier",
      "unitPrice",
      "quantity",
    ];

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setToastMessage("Please fill in all required fields");
      setShowToast(true);
      return;
    }

    const productData: Partial<StockItem> = {
      id: isEditMode ? existingProduct?.id : `STK${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unitPrice: parseFloat(formData.unitPrice || "0"),
      quantity: parseInt(formData.quantity || "0"),
      unit: formData.unit,
      brand: formData.brand,
      size: formData.size,
      status: "in-stock" as const,
      lastRestocked: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      supplier: formData.supplier,
      barcode: formData.barcode || undefined,
      image: formData.imageUrl || undefined,
    } as StockItem;

    try {
      if (!isEditMode) {
        await addNewProduct(productData);
        setToastMessage("Product added successfully!");
        setShowToast(true);

        setTimeout(() => {
          setFormData({
            name: "",
            description: "",
            category: "",
            subcategory: "",
            unitPrice: "",
            quantity: "",
            unit: "pieces",
            brand: "",
            size: "",
            supplier: "",
            barcode: "",
            imageUrl: "",
          });
          setCapturedImage(null);
          setAiPopulatedFields([]);
          setImageProcessingSuccess(false);
        }, 1000);

        setTimeout(() => {
          history.push("/stock-overview");
        }, 2000);
      } else {
        console.log("Updated Product:", productData);
        setToastMessage("Product updated successfully!");
        setShowToast(true);

        setTimeout(() => {
          history.push("/stock-overview");
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setToastMessage("Error saving product. Please try again.");
      setShowToast(true);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  };

  const handleImageUpload = () => {
    setShowActionSheet(true);
  };

  const isFieldPopulatedByAI = (fieldName: string): boolean => {
    return aiPopulatedFields.some((field) =>
      field.toLowerCase().includes(fieldName.toLowerCase())
    );
  };

  const captureImage = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setFormData((prev) => ({ ...prev, imageUrl: image.dataUrl! }));
        setShowActionSheet(false);
        await processImageWithAI(image.dataUrl);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      setToastMessage("Failed to capture image");
      setShowToast(true);
    }
  };

  const processImageWithAI = async (imageDataUrl: string) => {
    setIsProcessingImage(true);
    setImageProcessingSuccess(false);

    setToastMessage("🤖 AI is analyzing your image...");
    setShowToast(true);

    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      const message = `Analyze this product image and extract detailed product information. 

IMPORTANT INSTRUCTIONS:
- Look closely at labels, packaging, text, and visual details in the image
- Extract ACTUAL information visible in the image, not generic placeholders
- If you can't read specific details, say "Not clearly visible" rather than guessing
- Provide accurate size/weight information if visible on packaging
- Identify the specific brand name shown on the product
- Determine the most appropriate category and subcategory based on the product type

Return ONLY a JSON object in this exact format:
{
  "name": "actual product name from packaging",
  "brand": "actual brand name visible on product", 
  "size": "actual size/weight shown on packaging",
  "category": "most appropriate category from: Food, Beverages, Dairy, Household, Health & Beauty",
  "subcategory": "specific subcategory based on product type",
  "description": "detailed description of what you can see in the image",
  "image_url": ""
}`;

      const aiResponse = await askAiAssistant(
        message,
        currentSessionId || undefined,
        blob
      );

      // Parse AI response
      let data;
      try {
        data =
          typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
      } catch {
        if (typeof aiResponse === "string") {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              data = JSON.parse(jsonMatch[0]);
            } catch {
              setToastMessage(
                "AI responded but could not parse product data. Please fill in details manually."
              );
              setShowToast(true);
              return;
            }
          } else {
            setToastMessage(
              "AI analyzed the image but returned unexpected format. Please fill in details manually."
            );
            setShowToast(true);
            return;
          }
        } else {
          setToastMessage(
            "Received AI response but could not process it. Please fill in details manually."
          );
          setShowToast(true);
          return;
        }
      }

      // Handle multiple response formats
      let product;
      if (data && data.success && data.product) {
        product = data.product;
      } else if (data && data.product) {
        product = data.product;
      } else if (data && (data.name || data.brand)) {
        product = data;
      } else if (data && data.data && data.data.product) {
        product = data.data.product;
      } else {
        throw new Error(
          "Failed to extract product information from AI response structure"
        );
      }

      if (product) {
        const populatedFields: Partial<typeof formData> = {};

        if (
          product.name &&
          typeof product.name === "string" &&
          product.name.trim()
        ) {
          populatedFields.name = product.name.trim();
        }

        if (
          product.brand &&
          typeof product.brand === "string" &&
          product.brand.trim()
        ) {
          populatedFields.brand = product.brand.trim();
        }

        if (
          product.size &&
          typeof product.size === "string" &&
          product.size.trim()
        ) {
          populatedFields.size = product.size.trim();
        }

        if (
          product.category &&
          typeof product.category === "string" &&
          product.category.trim()
        ) {
          const categoryValue = product.category.trim();
          const matchedCategory = categories.find(
            (cat) =>
              cat.value.toLowerCase() === categoryValue.toLowerCase() ||
              cat.subcategories.some(
                (sub) => sub.toLowerCase() === categoryValue.toLowerCase()
              )
          );

          if (matchedCategory) {
            populatedFields.category = matchedCategory.value;

            if (
              product.subcategory &&
              typeof product.subcategory === "string" &&
              product.subcategory.trim()
            ) {
              const subcategoryValue = product.subcategory.trim();
              const matchedSubcategory = matchedCategory.subcategories.find(
                (sub) => sub.toLowerCase() === subcategoryValue.toLowerCase()
              );
              if (matchedSubcategory) {
                populatedFields.subcategory = matchedSubcategory;
              }
            }
          }
        }

        if (
          product.description &&
          typeof product.description === "string" &&
          product.description.trim()
        ) {
          populatedFields.description = product.description.trim();
        }

        const fieldNames = Object.keys(populatedFields).map((key) => {
          return key.charAt(0).toUpperCase() + key.slice(1);
        });
        setAiPopulatedFields(fieldNames);

        setFormData((prev) => ({
          ...prev,
          ...populatedFields,
        }));

        setImageProcessingSuccess(true);

        const populatedCount = Object.keys(populatedFields).length;
        if (populatedCount > 0) {
          const fieldsList = fieldNames.join(", ");
          setToastMessage(
            `✅ AI extracted ${populatedCount} fields from image: ${fieldsList}. Review and complete remaining fields.`
          );
        } else {
          setToastMessage(
            `⚠️ AI processed the image but could not extract specific product details. Please fill in manually.`
          );
        }
        setShowToast(true);
      } else {
        throw new Error("No valid product data found in AI response");
      }
    } catch (error) {
      console.error("Error processing image with AI:", error);
      setToastMessage(
        "Failed to process image with AI. Please fill in details manually or try again."
      );
      setShowToast(true);
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/stock-overview" />
          </IonButtons>
          <IonTitle>{isEditMode ? "Edit Product" : "Add New Product"}</IonTitle>
          <IonButtons slot="end">
            <IonAvatar className="header-avatar" onClick={handleProfileClick}>
              <img src="https://picsum.photos/100" alt="Profile" />
            </IonAvatar>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">
              {isEditMode ? "Edit Product" : "New Product"}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* AI-Powered Product Creation */}
        {!isEditMode && !capturedImage && (
          <IonCard
            style={{
              background:
                "linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-secondary-tint))",
              color: "white",
              marginBottom: "20px",
            }}
          >
            <IonCardHeader>
              <IonCardTitle
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <IonIcon icon={sparklesOutline} />
                Try AI-Powered Product Creation
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ marginBottom: "16px" }}>
                Save time! Let AI extract product details automatically from a
                single photo.
              </p>
              <IonButton
                fill="outline"
                style={{ "--color": "white", "--border-color": "white" }}
                routerLink="/add-product-by-image"
                routerDirection="forward"
              >
                <IonIcon icon={sparklesOutline} slot="start" />
                Use AI Assistant
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Product Image Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="image-card-title">
              {isProcessingImage ? (
                <>
                  <IonSpinner name="dots" color="primary" />
                  Processing Image...
                </>
              ) : (
                <>
                  <IonIcon icon={cameraOutline} className="ai-icon" />
                  Product Image
                </>
              )}
              {imageProcessingSuccess &&
                !isProcessingImage &&
                capturedImage && (
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    className="success-icon"
                  />
                )}
            </IonCardTitle>
            <p className="image-card-subtitle">
              {isProcessingImage
                ? "AI is analyzing your image and extracting product information..."
                : "Capture or select an image to get AI assistance with product details"}
            </p>
          </IonCardHeader>
          <IonCardContent>
            <div className="image-upload-section">
              {capturedImage ? (
                <div className="image-preview">
                  <img
                    src={capturedImage}
                    alt="Product"
                    className="preview-image"
                  />
                  {isProcessingImage && (
                    <div className="processing-overlay">
                      <IonSpinner name="crescent" color="light" />
                      <p>Extracting product info...</p>
                      <small>This may take a few seconds</small>
                    </div>
                  )}
                  {!isProcessingImage && (
                    <div className="image-overlay">
                      <IonButton
                        fill="clear"
                        className="retake-button"
                        onClick={handleImageUpload}
                      >
                        <IonIcon icon={cameraOutline} />
                        Retake
                      </IonButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="image-placeholder">
                  <IonIcon icon={cameraOutline} size="large" />
                  <h3>Add Product Image</h3>
                  <p>Get product details automatically with AI</p>
                  <div className="ai-features">
                    <small>
                      ✨ AI can extract: Name • Brand • Size • Category •
                      Description
                    </small>
                  </div>
                  <div className="upload-buttons">
                    <IonButton
                      fill="solid"
                      className="primary-upload-button"
                      onClick={handleImageUpload}
                      disabled={isProcessingImage}
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Take Photo
                    </IonButton>
                    <IonButton
                      fill="outline"
                      className="secondary-upload-button"
                      onClick={handleImageUpload}
                      disabled={isProcessingImage}
                    >
                      <IonIcon icon={imagesOutline} slot="start" />
                      Choose Image
                    </IonButton>
                  </div>
                  <div className="image-tips">
                    <small>
                      💡 Tips: Use good lighting, show product labels clearly,
                      avoid blurry images
                    </small>
                  </div>
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Basic Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Basic Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-field">
              <label className="form-label required">
                Product Name
                {isFieldPopulatedByAI("name") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.name}
                onIonInput={(e) => handleInputChange("name", e.detail.value!)}
                placeholder="Enter product name"
              />
            </div>

            <div className="form-field">
              <label className="form-label required">
                Brand
                {isFieldPopulatedByAI("brand") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.brand}
                onIonInput={(e) => handleInputChange("brand", e.detail.value!)}
                placeholder="Enter brand name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Description
                {isFieldPopulatedByAI("description") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonTextarea
                className="form-textarea"
                value={formData.description}
                onIonInput={(e) =>
                  handleInputChange("description", e.detail.value!)
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Size
                {isFieldPopulatedByAI("size") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.size}
                onIonInput={(e) => handleInputChange("size", e.detail.value!)}
                placeholder="e.g., 2L, 500ml, 250g"
              />
            </div>
          </IonCardContent>
        </IonCard>

        {/* Category */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Category</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-field">
              <label className="form-label required">
                Category
                {isFieldPopulatedByAI("category") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonSelect
                className="form-select"
                value={formData.category}
                onIonChange={(e) => handleCategoryChange(e.detail.value)}
                placeholder="Select category"
              >
                {categories.map((cat) => (
                  <IonSelectOption key={cat.value} value={cat.value}>
                    {cat.value}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className="form-field">
              <label className="form-label required">
                Subcategory
                {isFieldPopulatedByAI("subcategory") && (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginLeft: "8px",
                      color: "var(--ion-color-primary)",
                      fontSize: "14px",
                    }}
                    title="Auto-filled by AI"
                  />
                )}
              </label>
              <IonSelect
                className="form-select"
                value={formData.subcategory}
                onIonChange={(e) =>
                  handleInputChange("subcategory", e.detail.value)
                }
                placeholder="Select subcategory"
                disabled={!formData.category}
              >
                {getSubcategories().map((subcat) => (
                  <IonSelectOption key={subcat} value={subcat}>
                    {subcat}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Pricing & Inventory */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Pricing & Inventory</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-field">
              <label className="form-label required">Unit Price</label>
              <IonInput
                className="form-input"
                type="number"
                value={formData.unitPrice}
                onIonInput={(e) =>
                  handleInputChange("unitPrice", e.detail.value!)
                }
                placeholder="0.00"
              />
            </div>

            <div className="form-field">
              <label className="form-label required">Initial Quantity</label>
              <IonInput
                className="form-input"
                type="number"
                value={formData.quantity}
                onIonInput={(e) =>
                  handleInputChange("quantity", e.detail.value!)
                }
                placeholder="0"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Unit Type</label>
              <IonSelect
                className="form-select"
                value={formData.unit}
                onIonChange={(e) => handleInputChange("unit", e.detail.value)}
              >
                {units.map((unit) => (
                  <IonSelectOption key={unit} value={unit}>
                    {unit}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Additional Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Additional Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="form-field">
              <label className="form-label required">Supplier</label>
              <IonInput
                className="form-input"
                value={formData.supplier}
                onIonInput={(e) =>
                  handleInputChange("supplier", e.detail.value!)
                }
                placeholder="Enter supplier name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Barcode (Optional)</label>
              <IonInput
                className="form-input"
                value={formData.barcode}
                onIonInput={(e) =>
                  handleInputChange("barcode", e.detail.value!)
                }
                placeholder="Enter barcode"
              />
            </div>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: "Take Photo",
            icon: cameraOutline,
            handler: () => captureImage(CameraSource.Camera),
          },
          {
            text: "Choose from Gallery",
            icon: imagesOutline,
            handler: () => captureImage(CameraSource.Photos),
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
        header="Add Product Image"
        subHeader="Choose how you'd like to add an image"
      />

      <IonFooter mode="ios">
        <div className="save-footer">
          <IonButton
            expand="block"
            className="save-product-button"
            onClick={handleSave}
            disabled={!validateForm() || isProductsLoading}
            size="large"
          >
            <IonIcon icon={saveOutline} slot="start" />
            {isProductsLoading
              ? "Saving..."
              : isEditMode
              ? "Update Product"
              : "Save Product"}
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default NewProduct;
