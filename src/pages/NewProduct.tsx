// filepath: /Users/walterbanda/Desktop/Hackathon/untitled folder/accounts-agents/src/pages/NewProduct.tsx
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
  IonList,
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
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonItem,
} from "@ionic/react";
import {
  saveOutline,
  cameraOutline,
  imagesOutline,
  sparklesOutline,
  checkmarkCircleOutline,
  cubeOutline,
  layersOutline,
  pricetagOutline,
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
    packPrice: "",
    packSize: "", 
    packQuantity: "", 
    packUnit: "packs",
    saleType: "individual", 
    brand: "",
    size: "",
    supplier: "",
    barcode: "",
    individualImageUrl: "",
    packImageUrl: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [capturedIndividualImage, setCapturedIndividualImage] = useState<string | null>(null);
  const [capturedPackImage, setCapturedPackImage] = useState<string | null>(null);
  const [imageProcessingSuccess, setImageProcessingSuccess] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'individual' | 'pack'>('individual');
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);
  const [lastAiResponse, setLastAiResponse] = useState<string>("");

  const categories = [
    {
      value: "Food",
      subcategories: [
        "Snacks",
        "Baking Ingredients",
        "Condiments",
        "Canned Goods",
        "Grains & Rice",
        "Pasta",
        "Oils & Vinegars",
      ],
    },
    {
      value: "Beverages",
      subcategories: [
        "Soft Drinks",
        "Juices",
        "Water",
        "Energy Drinks",
        "Tea & Coffee",
        "Alcoholic",
      ],
    },
    {
      value: "Snacks",
      subcategories: [
        "Chips",
        "Cookies",
        "Nuts",
        "Candy",
        "Crackers",
        "Dried Fruits",
      ],
    },
    {
      value: "Dairy",
      subcategories: ["Milk", "Cheese", "Yogurt", "Butter", "Cream", "Eggs"],
    },
    {
      value: "Bakery",
      subcategories: [
        "Bread",
        "Pastries",
        "Cakes",
        "Cookies",
        "Muffins",
        "Rolls",
      ],
    },
    {
      value: "Household",
      subcategories: ["Cleaning", "Personal Care", "Paper Products", "Laundry"],
    },
    {
      value: "Health & Beauty",
      subcategories: [
        "Vitamins",
        "First Aid",
        "Skincare",
        "Hair Care",
        "Oral Care",
      ],
    },
    {
      value: "Frozen",
      subcategories: [
        "Frozen Meals",
        "Ice Cream",
        "Frozen Vegetables",
        "Frozen Fruits",
      ],
    },
  ];

  const units = [
    "pieces",
    "packs",
    "boxes",
    "bags",
    "bottles",
    "cans",
    "jars",
    "tubes",
    "sachets",
    "cartons",
    "containers",
    "packages",
    "bundles",
    "sets",
    "pairs",
    "kg",
    "g",
    "liters",
    "ml",
    "dozen",
    "each",
    "rolls",
    "sheets",
    "loaves",
    "slices",
    "portions",
    "servings",
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
        // Pack fields (set defaults for existing products)
        packPrice: "",
        packSize: "",
        packQuantity: "",
        packUnit: "packs",
        saleType: "individual",
        // Other fields
        brand: existingProduct.brand,
        size: existingProduct.size,
        supplier: existingProduct.supplier,
        barcode: existingProduct.barcode || "",
        individualImageUrl: existingProduct.image || "",
        packImageUrl: "",
      });
      if (existingProduct.image) {
        setCapturedIndividualImage(existingProduct.image);
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
    ];
    
    // Check basic required fields
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        return false;
      }
    }
    
    if (formData.saleType === "individual" || formData.saleType === "both") {
      if (!formData.unitPrice || !formData.quantity) {
        return false;
      }
    }
    
    if (formData.saleType === "pack" || formData.saleType === "both") {
      if (!formData.packPrice || !formData.packSize || !formData.packQuantity) {
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
      image: formData.individualImageUrl || formData.packImageUrl || undefined,
      packPrice: formData.packPrice ? parseFloat(formData.packPrice) : undefined,
      packSize: formData.packSize ? parseInt(formData.packSize) : undefined,
      packQuantity: formData.packQuantity ? parseInt(formData.packQuantity) : undefined,
      saleType: formData.saleType,
    } as StockItem & {
      packPrice?: number;
      packSize?: number;
      packQuantity?: number;
      saleType: string;
    };

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
            packPrice: "",
            packSize: "",
            packQuantity: "",
            packUnit: "packs",
            saleType: "individual",
            brand: "",
            size: "",
            supplier: "",
            barcode: "",
            individualImageUrl: "",
            packImageUrl: "",
          });
          setCapturedIndividualImage(null);
          setCapturedPackImage(null);
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

  const handleImageUpload = (imageType: 'individual' | 'pack') => {
    setCurrentImageType(imageType);
    setShowActionSheet(true);
  };

  const isFieldPopulatedByAI = (fieldName: string): boolean => {
    return aiPopulatedFields.some((field) =>
      field.toLowerCase().includes(fieldName.toLowerCase())
    );
  };

  // Development helper to test AI backend
  const testAiBackend = async () => {
    if (process.env.NODE_ENV !== "development") return;

    try {
      console.log("Testing AI backend connection...");
      const testMessage =
        "This is a test message to check if the AI backend is working.";
      const response = await askAiAssistant(
        testMessage,
        currentSessionId || undefined
      );
      console.log("AI backend test response:", response);
      setToastMessage(
        "✅ AI backend is responding. Check console for details."
      );
      setShowToast(true);
    } catch (error) {
      console.error("AI backend test failed:", error);
      setToastMessage("❌ AI backend test failed. Check console for details.");
      setShowToast(true);
    }
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
        if (currentImageType === 'individual') {
          setCapturedIndividualImage(image.dataUrl);
          setFormData(prev => ({ ...prev, individualImageUrl: image.dataUrl! }));
        } else {
          setCapturedPackImage(image.dataUrl);
          setFormData(prev => ({ ...prev, packImageUrl: image.dataUrl! }));
        }
        setShowActionSheet(false);
        await processImageWithAI(image.dataUrl, currentImageType);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      setToastMessage("Failed to capture image");
      setShowToast(true);
    }
  };

  const processImageWithAI = async (imageDataUrl: string, imageType: 'individual' | 'pack') => {
    setIsProcessingImage(true);
    setImageProcessingSuccess(false);

    const promptSuffix = imageType === 'pack' 
      ? "This is a PACK/CARTON image. Focus on pack details like pack size, total contents, bulk pricing information."
      : "This is an INDIVIDUAL ITEM image. Focus on single unit details like unit price, individual product information.";

    setToastMessage(`🤖 AI is analyzing your ${imageType} image...`);
    setShowToast(true);

    try {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      const message = `Analyze this ${imageType} product image carefully and extract detailed product information. 

${promptSuffix}

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
  "category": "most appropriate category from: Food, Beverages, Snacks, Dairy, Bakery, Household, Health & Beauty, General",
  "subcategory": "specific subcategory based on product type",
  "description": "detailed description of what you can see in the image",
  "image_url": ""
}`;

      const aiResponse = await askAiAssistant(
        message,
        currentSessionId || undefined,
        blob
      );

      setLastAiResponse(
        typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse)
      );

      // Parse AI response
      let data;
      try {
        data = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
      } catch {
        if (typeof aiResponse === "string") {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              data = JSON.parse(jsonMatch[0]);
            } catch {
              setToastMessage("AI responded but could not parse product data. Please fill in details manually.");
              setShowToast(true);
              return;
            }
          } else {
            setToastMessage("AI analyzed the image but returned unexpected format. Please fill in details manually.");
            setShowToast(true);
            return;
          }
        } else {
          setToastMessage("Received AI response but could not process it. Please fill in details manually.");
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
        throw new Error("Failed to extract product information from AI response structure");
      }

      if (product) {
        const populatedFields: Partial<typeof formData> = {};

        if (product.name && typeof product.name === "string" && product.name.trim()) {
          populatedFields.name = product.name.trim();
        }

        if (product.brand && typeof product.brand === "string" && product.brand.trim()) {
          populatedFields.brand = product.brand.trim();
        }

        if (product.size && typeof product.size === "string" && product.size.trim()) {
          populatedFields.size = product.size.trim();
        }

        if (product.category && typeof product.category === "string" && product.category.trim()) {
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

            if (product.subcategory && typeof product.subcategory === "string" && product.subcategory.trim()) {
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

        if (product.description && typeof product.description === "string" && product.description.trim()) {
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
            `✅ AI extracted ${populatedCount} fields from ${imageType} image: ${fieldsList}. Review and complete remaining fields.`
          );
        } else {
          setToastMessage(
            `⚠️ AI processed the ${imageType} image but could not extract specific product details. Please fill in manually.`
          );
        }
        setShowToast(true);
      } else {
        throw new Error("No valid product data found in AI response");
      }
    } catch (error) {
      console.error("Error processing image with AI:", error);
      setToastMessage(`Failed to process ${imageType} image with AI. Please fill in details manually or try again.`);
      setShowToast(true);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const renderImageUploadCard = (type: 'individual' | 'pack') => {
    const currentImage = type === 'individual' ? capturedIndividualImage : capturedPackImage;
    const icon = type === 'individual' ? cubeOutline : layersOutline;
    const title = type === 'individual' ? 'Individual Item Image' : 'Pack/Carton Image';
    const subtitle = type === 'individual' 
      ? 'Upload image of a single unit for individual sale pricing'
      : 'Upload image of the pack/carton for bulk sale pricing';

    return (
      <IonCard
        className={`image-upload-card ${
          isProcessingImage && currentImageType === type ? "processing" : ""
        }`}
      >
        <IonCardHeader>
          <IonCardTitle className="image-card-title">
            {isProcessingImage && currentImageType === type ? (
              <IonSpinner name="dots" color="primary" />
            ) : (
              <IonIcon icon={icon} className="ai-icon" />
            )}
            {isProcessingImage && currentImageType === type ? "Processing Image..." : title}
            {imageProcessingSuccess && !isProcessingImage && currentImage && (
              <IonIcon
                icon={checkmarkCircleOutline}
                className="success-icon"
              />
            )}
          </IonCardTitle>
          <p className="image-card-subtitle">
            {isProcessingImage && currentImageType === type
              ? "AI is analyzing your image and extracting product information..."
              : subtitle}
          </p>
        </IonCardHeader>
        <IonCardContent>
          <div className="image-upload-section">
            {currentImage ? (
              <div className="image-preview">
                <img
                  src={currentImage}
                  alt={`${type} Product`}
                  className="preview-image"
                />
                {isProcessingImage && currentImageType === type && (
                  <div className="processing-overlay">
                    <IonSpinner name="crescent" color="light" />
                    <p>Extracting product info...</p>
                    <small>This may take a few seconds</small>
                  </div>
                )}
                {!(isProcessingImage && currentImageType === type) && (
                  <div className="image-overlay">
                    <IonButton
                      fill="clear"
                      className="retake-button"
                      onClick={() => handleImageUpload(type)}
                    >
                      <IonIcon icon={cameraOutline} />
                      Retake
                    </IonButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="image-placeholder">
                <IonIcon icon={icon} size="large" />
                <h3>Add {type === 'individual' ? 'Individual Item' : 'Pack/Carton'} Image</h3>
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
                    onClick={() => handleImageUpload(type)}
                    disabled={isProcessingImage}
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Take Photo
                  </IonButton>
                  <IonButton
                    fill="outline"
                    className="secondary-upload-button"
                    onClick={() => handleImageUpload(type)}
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
    );
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

        {/* Sale Type Selection */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={pricetagOutline} style={{marginRight: '8px'}} />
              Sale Type
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonRadioGroup
              value={formData.saleType}
              onIonChange={(e) => handleInputChange("saleType", e.detail.value)}
            >
              <IonItem>
                <IonLabel>Individual Item Sales Only</IonLabel>
                <IonRadio slot="start" value="individual" />
              </IonItem>
              <IonItem>
                <IonLabel>Pack/Carton Sales Only</IonLabel>
                <IonRadio slot="start" value="pack" />
              </IonItem>
              <IonItem>
                <IonLabel>Both Individual & Pack Sales</IonLabel>
                <IonRadio slot="start" value="both" />
              </IonItem>
            </IonRadioGroup>
          </IonCardContent>
        </IonCard>

        {/* Product Images Section */}
        {(formData.saleType === "individual" || formData.saleType === "both") && 
          renderImageUploadCard('individual')
        }
        
        {(formData.saleType === "pack" || formData.saleType === "both") && 
          renderImageUploadCard('pack')
        }

        {/* Guide Section */}
        {!capturedIndividualImage && !capturedPackImage && !isProcessingImage && (
          <IonCard className="guide-card">
            <IonCardContent className="guide-content">
              <div className="guide-header">
                <IonIcon icon={sparklesOutline} className="guide-icon" />
                <h4>Enhanced Product Management</h4>
              </div>
              <div className="guide-steps">
                <div className="guide-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h5>Choose Sale Type</h5>
                    <p>
                      Select whether you sell individual items, packs/cartons, or both
                    </p>
                  </div>
                </div>
                <div className="guide-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h5>Upload Images</h5>
                    <p>Add separate images for individual items and packs for better inventory management</p>
                  </div>
                </div>
                <div className="guide-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h5>AI Extraction & Pricing</h5>
                    <p>AI extracts details and you set pricing for both individual and pack sales</p>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        <IonList>
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
                  onIonInput={(e) =>
                    handleInputChange("brand", e.detail.value!)
                  }
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

          {/* Individual Item Pricing */}
          {(formData.saleType === "individual" || formData.saleType === "both") && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={cubeOutline} style={{marginRight: '8px'}} />
                  Individual Item Pricing & Inventory
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-field">
                  <label className="form-label required">Individual Unit Price</label>
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
                  <label className="form-label required">Initial Quantity (Individual Items)</label>
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
          )}

          {/* Pack/Carton Pricing */}
          {(formData.saleType === "pack" || formData.saleType === "both") && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={layersOutline} style={{marginRight: '8px'}} />
                  Pack/Carton Pricing & Inventory
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-field">
                  <label className="form-label required">Pack/Carton Price</label>
                  <IonInput
                    className="form-input"
                    type="number"
                    value={formData.packPrice}
                    onIonInput={(e) =>
                      handleInputChange("packPrice", e.detail.value!)
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label required">Units per Pack/Carton</label>
                  <IonInput
                    className="form-input"
                    type="number"
                    value={formData.packSize}
                    onIonInput={(e) =>
                      handleInputChange("packSize", e.detail.value!)
                    }
                    placeholder="e.g., 12 (items per pack)"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label required">Initial Packs/Cartons in Stock</label>
                  <IonInput
                    className="form-input"
                    type="number"
                    value={formData.packQuantity}
                    onIonInput={(e) =>
                      handleInputChange("packQuantity", e.detail.value!)
                    }
                    placeholder="0"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Pack Unit Type</label>
                  <IonSelect
                    className="form-select"
                    value={formData.packUnit}
                    onIonChange={(e) => handleInputChange("packUnit", e.detail.value)}
                  >
                    <IonSelectOption value="packs">Packs</IonSelectOption>
                    <IonSelectOption value="cartons">Cartons</IonSelectOption>
                    <IonSelectOption value="cases">Cases</IonSelectOption>
                    <IonSelectOption value="boxes">Boxes</IonSelectOption>
                    <IonSelectOption value="bundles">Bundles</IonSelectOption>
                  </IonSelect>
                </div>
              </IonCardContent>
            </IonCard>
          )}

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
        </IonList>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />

        {/* Debug panel for development */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "fixed",
              bottom: "10px",
              left: "10px",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "10px",
              borderRadius: "5px",
              fontSize: "10px",
              zIndex: 9999,
            }}
          >
            <strong>Debug Tools:</strong>
            <br />
            <button
              onClick={testAiBackend}
              style={{
                marginTop: "5px",
                padding: "5px 10px",
                fontSize: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Test AI Backend
            </button>
          </div>
        )}

        {process.env.NODE_ENV === "development" && lastAiResponse && (
          <div
            style={{
              position: "fixed",
              bottom: "10px",
              right: "10px",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "10px",
              borderRadius: "5px",
              fontSize: "10px",
              maxWidth: "300px",
              maxHeight: "200px",
              overflow: "auto",
              zIndex: 9999,
            }}
          >
            <strong>Last AI Response:</strong>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: "5px" }}>
              {lastAiResponse.substring(0, 500)}
              {lastAiResponse.length > 500 ? "..." : ""}
            </pre>
          </div>
        )}
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
        header={`Add ${currentImageType === 'individual' ? 'Individual Item' : 'Pack/Carton'} Image`}
        subHeader={`Choose how you'd like to add a ${currentImageType} image`}
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
