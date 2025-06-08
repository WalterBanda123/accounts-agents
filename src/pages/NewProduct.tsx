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
  const [retryCount, setRetryCount] = useState(0);
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
      "unitPrice",
      "quantity",
      "brand",
      "supplier",
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
      unitPrice: parseFloat(formData.unitPrice),
      quantity: parseInt(formData.quantity),
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
    };

    try {
      if (!isEditMode) {
        // Add new product using DataContext
        await addNewProduct(productData);

        setToastMessage("Product added successfully!");
        setShowToast(true);

        // Reset form after successful save
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
          setImageProcessingSuccess(false);
          setAiPopulatedFields([]);
        }, 1000);

        // Navigate back to stocks page after a delay
        setTimeout(() => {
          history.push("/stock-overview");
        }, 2000);
      } else {
        // TODO: Implement product update functionality
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
        setCapturedImage(image.dataUrl);
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
    setRetryCount(0); // Reset retry count for new image

    // Show initial processing message
    setToastMessage("🤖 AI is analyzing your image...");
    setShowToast(true);

    try {
      // Convert data URL to Blob for raw image data upload
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Enhanced prompt with detailed instructions for better AI analysis
      const message = `Analyze this product image carefully and extract detailed product information. 

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
}

VALIDATION: If the image shows a clear product but you return generic values like "Product from Image", "Unknown Brand", or "General", the analysis will be considered failed.`;

      console.log("Enhanced AI prompt:", message);
      console.log("Image blob size:", blob.size, "bytes");

      // Use askAiAssistant with image File/Blob
      const aiResponse = await askAiAssistant(
        message,
        currentSessionId || undefined,
        blob
      );

      setLastAiResponse(
        typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse)
      );
      console.log("Raw AI response received:", aiResponse);
      console.log("AI response type:", typeof aiResponse);

      // Enhanced AI response parsing with multiple fallback strategies
      let data;
      try {
        data =
          typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;
      } catch {
        // Try to extract JSON from text response if it's embedded
        if (typeof aiResponse === "string") {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              data = JSON.parse(jsonMatch[0]);
            } catch {
              console.log("Raw AI response (no valid JSON found):", aiResponse);
              setToastMessage(
                "AI responded but could not parse product data. Please fill in details manually."
              );
              setShowToast(true);
              return;
            }
          } else {
            console.log(
              "Raw AI response (no JSON structure found):",
              aiResponse
            );
            setToastMessage(
              "AI analyzed the image but returned unexpected format. Please fill in details manually."
            );
            setShowToast(true);
            return;
          }
        } else {
          console.log("Raw AI response:", aiResponse);
          setToastMessage(
            "Received AI response but could not process it. Please fill in details manually."
          );
          setShowToast(true);
          return;
        }
      }

      console.log("Parsed AI response data:", data);

      // Handle multiple response formats
      let product;
      if (data && data.success && data.product) {
        product = data.product;
      } else if (data && data.product) {
        product = data.product;
      } else if (data && (data.name || data.brand)) {
        // Direct product data without wrapper
        product = data;
      } else if (data && data.data && data.data.product) {
        // Nested data structure
        product = data.data.product;
      } else {
        throw new Error(
          "Failed to extract product information from AI response structure"
        );
      }

      console.log("Extracted product data:", product);

      // Validate that AI provided meaningful data (not generic placeholders)
      const isGenericResponse = (product: {
        name?: string;
        brand?: string;
        description?: string;
        category?: string;
        subcategory?: string;
      }): boolean => {
        const genericIndicators = [
          "product from image",
          "unknown brand",
          "product imported from image",
          "please update details",
          "general",
          "miscellaneous",
        ];

        const checkGeneric = (value: string) => {
          if (!value || typeof value !== "string") return false;
          return genericIndicators.some((indicator) =>
            value.toLowerCase().includes(indicator.toLowerCase())
          );
        };

        return (
          checkGeneric(product.name || "") ||
          checkGeneric(product.brand || "") ||
          checkGeneric(product.description || "") ||
          (product.category === "General" &&
            product.subcategory === "Miscellaneous")
        );
      };

      if (isGenericResponse(product)) {
        console.warn("AI returned generic placeholder data:", product);

        // Try retry logic if this is the first attempt
        if (retryCount < 1) {
          console.log("Attempting retry with more specific prompt...");
          setRetryCount(retryCount + 1);

          // Try a more specific retry prompt
          const retryMessage = `This is a retry attempt. The previous analysis returned generic data. Please look more carefully at this product image and provide SPECIFIC details:

FOCUS ON:
- Read any text/labels visible on the packaging
- Identify specific brand names, product names, sizes
- Look for nutritional info, ingredients, or product descriptions
- Examine logos, colors, and visual elements

If you truly cannot read specific details from the image, respond with:
{"error": "Cannot read product details from image", "reason": "image quality/lighting/angle"}

Otherwise, provide specific extracted information in JSON format.`;

          // Recursive retry call
          const retryResponse = await askAiAssistant(
            retryMessage,
            currentSessionId || undefined,
            blob
          );
          setLastAiResponse(
            typeof retryResponse === "string"
              ? retryResponse
              : JSON.stringify(retryResponse)
          );

          // Parse retry response
          let retryData;
          try {
            retryData =
              typeof retryResponse === "string"
                ? JSON.parse(retryResponse)
                : retryResponse;

            if (retryData.error) {
              console.log("AI confirmed image quality issue:", retryData);
              setToastMessage(
                `🤖 ${
                  retryData.reason ||
                  "AI could not read the product details clearly"
                }. Please try: 1) Better lighting 2) Closer/clearer photo 3) Focus on product labels`
              );
              setShowToast(true);
              setIsProcessingImage(false);
              return;
            }

            // Check if retry gave better results
            if (!isGenericResponse(retryData)) {
              product = retryData.product || retryData;
              console.log("Retry successful with better data:", product);
            } else {
              throw new Error("Retry also returned generic data");
            }
          } catch (error) {
            console.log("Retry failed:", error);
            setToastMessage(
              "🤖 AI attempted analysis twice but could not extract clear product details. Image may need better lighting, focus, or angle. Please fill in manually."
            );
            setShowToast(true);
            setIsProcessingImage(false);
            return;
          }
        } else {
          setToastMessage(
            "🤖 AI processed the image but returned generic data after retry. The image may not be clear enough for analysis. Try: 1) Better lighting 2) Clearer view of product labels 3) Focus on text/branding"
          );
          setShowToast(true);
          setIsProcessingImage(false);
          return;
        }
      }

      // Additional validation for meaningful data
      if (!product.name || product.name.trim().length < 3) {
        console.warn("AI could not extract meaningful product name:", product);
        setToastMessage(
          "🤖 AI processed the image but could not identify the product name clearly. Please ensure the product label is visible and try again."
        );
        setShowToast(true);
        setIsProcessingImage(false);
        return;
      }

      if (product) {
        // Enhanced smart unit detection based on size and product analysis
        const guessUnit = (
          size: string,
          name?: string,
          category?: string
        ): string => {
          if (!size) return "pieces";

          const sizeStr = size.toLowerCase();
          const nameStr = (name || "").toLowerCase();
          const categoryStr = (category || "").toLowerCase();

          // Weight-based units
          if (sizeStr.includes("kg") || sizeStr.includes("kilogram"))
            return "kg";
          if (
            sizeStr.includes("g") &&
            !sizeStr.includes("kg") &&
            !sizeStr.includes("bag")
          )
            return "g";
          if (sizeStr.includes("lb") || sizeStr.includes("pound")) return "kg"; // Convert to metric
          if (sizeStr.includes("oz") && !sizeStr.includes("fl oz")) return "g"; // Convert to metric

          // Volume-based units
          if (
            sizeStr.includes("l") ||
            sizeStr.includes("liter") ||
            sizeStr.includes("litre")
          )
            return "liters";
          if (sizeStr.includes("ml") || sizeStr.includes("milliliter"))
            return "ml";
          if (sizeStr.includes("fl oz") || sizeStr.includes("fluid ounce"))
            return "ml"; // Convert to metric
          if (sizeStr.includes("gallon")) return "liters"; // Convert to metric

          // Pack/Multi-unit detection
          if (
            sizeStr.includes("pack") ||
            sizeStr.includes("pk") ||
            nameStr.includes("pack")
          ) {
            // Check for specific pack quantities
            if (sizeStr.match(/\d+\s*pack/) || nameStr.match(/\d+\s*pack/))
              return "packs";
            return "packs";
          }

          // Container-based units
          if (
            sizeStr.includes("bottle") ||
            nameStr.includes("bottle") ||
            categoryStr.includes("beverages")
          )
            return "bottles";
          if (sizeStr.includes("can") || nameStr.includes("can")) return "cans";
          if (sizeStr.includes("box") || nameStr.includes("box"))
            return "boxes";
          if (sizeStr.includes("bag") || nameStr.includes("bag")) return "bags";
          if (sizeStr.includes("jar") || nameStr.includes("jar")) return "jars";
          if (sizeStr.includes("tube") || nameStr.includes("tube"))
            return "tubes";
          if (sizeStr.includes("sachet") || nameStr.includes("sachet"))
            return "sachets";
          if (sizeStr.includes("roll") || nameStr.includes("roll"))
            return "rolls";
          if (sizeStr.includes("sheet") || nameStr.includes("sheet"))
            return "sheets";

          // Count-based units
          if (sizeStr.includes("dozen") || sizeStr.includes("12"))
            return "dozen";
          if (sizeStr.match(/\d+\s*(piece|pcs|count|ct)/)) return "pieces";

          // Category-specific defaults
          if (categoryStr.includes("dairy") && sizeStr.includes("carton"))
            return "cartons";
          if (categoryStr.includes("frozen") && sizeStr.includes("package"))
            return "packs";
          if (categoryStr.includes("bakery") && sizeStr.includes("loaf"))
            return "loaves";

          return "pieces"; // Default fallback
        };

        // Enhanced auto-population with smart field mapping and validation
        const populateFormFields = (product: Record<string, unknown>) => {
          const updatedFields: Partial<typeof formData> = {};

          // Basic field mapping with fallbacks
          if (
            product.name &&
            typeof product.name === "string" &&
            product.name.trim()
          ) {
            updatedFields.name = product.name.trim();
          }

          if (
            product.brand &&
            typeof product.brand === "string" &&
            product.brand.trim()
          ) {
            updatedFields.brand = product.brand.trim();
          }

          if (
            product.size &&
            typeof product.size === "string" &&
            product.size.trim()
          ) {
            updatedFields.size = product.size.trim();
            // Update unit based on enhanced detection
            updatedFields.unit = guessUnit(
              product.size as string,
              product.name as string,
              product.category as string
            );
          }

          // Category mapping with validation
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
              updatedFields.category = matchedCategory.value;

              // Smart subcategory detection
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
                  updatedFields.subcategory = matchedSubcategory;
                }
              }
            }
          }

          if (
            product.description &&
            typeof product.description === "string" &&
            product.description.trim()
          ) {
            updatedFields.description = product.description.trim();
          }

          if (
            product.image_url &&
            typeof product.image_url === "string" &&
            product.image_url.trim()
          ) {
            updatedFields.imageUrl = product.image_url.trim();
          }

          return updatedFields;
        };

        const populatedFields = populateFormFields(product);

        // Track which fields were populated by AI
        const fieldNames = Object.keys(populatedFields).map((key) => {
          switch (key) {
            case "imageUrl":
              return "Image URL";
            case "unitPrice":
              return "Unit Price";
            default:
              return key.charAt(0).toUpperCase() + key.slice(1);
          }
        });
        setAiPopulatedFields(fieldNames);

        // Auto-populate form fields with AI response
        setFormData((prev) => ({
          ...prev,
          ...populatedFields,
        }));

        setImageProcessingSuccess(true);

        // Count how many fields were populated
        const populatedCount = Object.keys(populatedFields).length;
        if (populatedCount > 0) {
          const fieldsList = fieldNames.join(", ");
          setToastMessage(
            `✅ AI extracted ${populatedCount} fields: ${fieldsList}. Review and complete remaining fields.`
          );
        } else {
          setToastMessage(
            "⚠️ AI processed the image but could not extract specific product details. Please fill in manually."
          );
        }
        setShowToast(true);
      } else {
        throw new Error("No valid product data found in AI response");
      }
    } catch (error) {
      console.error("Error processing image with AI:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to process image with AI. ";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage +=
          "Network connection issue. Please check your internet connection and try again.";
      } else if (error instanceof SyntaxError) {
        errorMessage +=
          "AI returned invalid data format. Please try with a clearer image.";
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        const errorObj = error as { message: string };
        if (errorObj.message.includes("extract product information")) {
          errorMessage +=
            "Could not identify product details in the image. Please use a clearer photo of the product packaging.";
        } else {
          errorMessage += "Please fill in details manually or try again.";
        }
      } else {
        errorMessage +=
          "Please fill in details manually or try again with a different image.";
      }

      setToastMessage(errorMessage);
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
        {/* Product Image Section */}
        <IonCard
          className={`image-upload-card ${
            isProcessingImage ? "processing" : ""
          }`}
        >
          <IonCardHeader>
            <IonCardTitle className="image-card-title">
              {isProcessingImage ? (
                <IonSpinner name="dots" color="primary" />
              ) : (
                <IonIcon icon={sparklesOutline} className="ai-icon" />
              )}
              {isProcessingImage ? "Processing Image..." : "Smart Image Upload"}
              {imageProcessingSuccess && !isProcessingImage && (
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="success-icon"
                />
              )}
            </IonCardTitle>
            <p className="image-card-subtitle">
              {isProcessingImage
                ? "AI is analyzing your image and extracting product information..."
                : "Take a photo or upload an image to automatically extract product information"}
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

        {/* Guide Section */}
        {!capturedImage && !isProcessingImage && (
          <IonCard className="guide-card">
            <IonCardContent className="guide-content">
              <div className="guide-header">
                <IonIcon icon={sparklesOutline} className="guide-icon" />
                <h4>Quick Start Guide</h4>
              </div>
              <div className="guide-steps">
                <div className="guide-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h5>Take or Upload Photo</h5>
                    <p>
                      Capture a clear image of your product or select from
                      gallery
                    </p>
                  </div>
                </div>
                <div className="guide-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h5>AI Extraction</h5>
                    <p>Our AI will automatically extract product information</p>
                  </div>
                </div>
                <div className="guide-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h5>Review & Save</h5>
                    <p>Check the details and add any missing information</p>
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
                <label className="form-label">
                  Unit
                  {isFieldPopulatedByAI("unit") && (
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
          duration={2000}
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
        header="Add Product Image"
        subHeader="Choose how you'd like to add a product image"
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
