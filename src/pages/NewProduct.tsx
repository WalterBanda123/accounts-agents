import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { fStorage } from "../../firebase.config";
import {
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
} from "@ionic/react";
import {
  saveOutline,
  sparklesOutline,
  cameraOutline,
  imagesOutline,
  pencilOutline,
} from "ionicons/icons";
import { StockItem } from "../mock/stocks";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { useDataContext } from "../contexts/data/UseDataContext";
import "./NewProduct.css";

interface LocationState {
  editMode?: boolean;
  productData?: StockItem;
}

const NewProduct: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const { user } = useAuthContext();
  const isEditMode = location.state?.editMode || false;
  const existingProduct = location.state?.productData;
  const { addNewProduct, isProductsLoading } = useDataContext();

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

  // New states for image capture functionality
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      setShowManualForm(true); // Show form immediately for edit mode
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

    console.log("🔍 Validating form...");
    console.log("📋 Current form data:", formData);

    for (const field of required) {
      const value = formData[field as keyof typeof formData];
      console.log(`${field}: "${value}" (${typeof value})`);
      if (!value) {
        console.log(`❌ Missing required field: ${field}`);
        return false;
      }
    }

    console.log("✅ All required fields are filled");
    return true;
  };

  const handleSave = async () => {
    console.log("💾 Starting product save process...");
    
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      setToastMessage("Please fill in all required fields");
      setShowToast(true);
      return;
    }

    console.log("✅ Form validation passed");
    console.log("📋 Form data:", formData);

    const productQuantity = parseInt(formData.quantity || "0");

    const productData: Partial<StockItem> = {
      id: isEditMode ? existingProduct?.id : `STK${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unitPrice: parseFloat(formData.unitPrice || "0"),
      quantity: productQuantity,
      unit: formData.unit,
      brand: formData.brand,
      size: formData.size,
      status: calculateStockStatus(productQuantity),
      lastRestocked: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      supplier: formData.supplier,
      ...(formData.barcode && { barcode: formData.barcode }),
      ...(formData.imageUrl && { image: formData.imageUrl }),
    } as StockItem;

    console.log("📦 Product data to save:", productData);

    try {
      if (!isEditMode) {
        console.log("🚀 Calling addNewProduct...");
        const result = await addNewProduct(productData);
        console.log("✅ addNewProduct result:", result);
        
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
        }, 1000);

        setTimeout(() => {
          history.push("/stock-overview");
        }, 2000);
      } else {
        console.log("📝 Edit mode - updating product:", productData);
        setToastMessage("Product updated successfully!");
        setShowToast(true);

        setTimeout(() => {
          history.push("/stock-overview");
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Error saving product:", error);
      setToastMessage("Error saving product. Please try again.");
      setShowToast(true);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  };

  // Camera and AI processing functions
  const uploadImageToStorage = async (
    imageDataUrl: string
  ): Promise<string> => {
    try {
      // Generate unique product ID
      const imageId = `product_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Upload image to Firebase Storage
      const storageRef = ref(fStorage, `products/${user?.id}/${imageId}.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // Wait for upload to complete
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
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
        await processImageWithAI(image.dataUrl);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      setToastMessage("Failed to capture image");
      setShowToast(true);
    }
  };

  const processImageWithAI = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setToastMessage("AI is analyzing your image...");
    setShowToast(true);

    try {
      // Upload image to storage first to get proper URL
      const uploadedImageUrl = await uploadImageToStorage(imageDataUrl);

      // Convert data URL to base64 (remove data:image/jpeg;base64, prefix)
      const base64Data = imageDataUrl.split(",")[1];

      const requestBody = {
        message:
          "Analyze this product image and extract detailed product information including title, brand, size, unit, category, subcategory, description, and any visible pricing or supplier information.",
        image_data: base64Data,
        is_url: false,
        user_id: user?.id || "anonymous",
      };

      const response = await fetch("http://localhost:8003/analyze_image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }

      const backendResponse = await response.json();

      if (
        backendResponse.status === "success" &&
        backendResponse.data?.product
      ) {
        const { product } = backendResponse.data;

        setFormData({
          name: product.title || product.name || "",
          brand: product.brand || "",
          size: product.size || "",
          unit: product.unit || "pieces",
          category: product.category || "",
          subcategory: product.subcategory || "",
          description: product.description || "",
          unitPrice: product.unitPrice || "",
          quantity: product.quantity || "1",
          supplier: product.supplier || "",
          barcode: product.barcode || "",
          imageUrl: uploadedImageUrl, // Use the uploaded image URL
        });

        setToastMessage("Product details extracted successfully!");
        setShowToast(true);
        setShowManualForm(true); // Show the form after successful extraction
      } else {
        throw new Error("Failed to extract product details");
      }
    } catch (error) {
      console.error("Error processing image with AI:", error);
      setToastMessage("Failed to process image. Please fill details manually.");
      setShowToast(true);
      setShowManualForm(true); // Show the form anyway for manual entry
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual image upload function
  const handleManualImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Only from gallery for manual upload
      });

      if (image.dataUrl) {
        // Upload to storage and get URL
        const uploadedImageUrl = await uploadImageToStorage(image.dataUrl);

        // Update form data with the uploaded image URL
        setFormData((prev) => ({
          ...prev,
          imageUrl: uploadedImageUrl,
        }));

        setCapturedImage(image.dataUrl); // For preview
        setToastMessage("Image uploaded successfully!");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setToastMessage("Failed to upload image");
      setShowToast(true);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Utility function to calculate stock status based on quantity
  const calculateStockStatus = (
    quantity: number
  ): "in-stock" | "low-stock" | "out-of-stock" => {
    if (quantity === 0) {
      return "out-of-stock";
    } else if (quantity <= 10) {
      // Low stock threshold
      return "low-stock";
    } else {
      return "in-stock";
    }
  };

  return (
    <IonPage className="NewProduct">
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/stock-overview" />
          </IonButtons>
          <IonTitle>{isEditMode ? "Edit Product" : "Add New Product"}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleProfileClick}>
              <InitialsAvatar
                name={user?.name || "User"}
                size="small"
                className="header-avatar"
              />
            </IonButton>
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

        {/* Add Product Options */}
        {!isEditMode && (
          <IonCard className="add-product-options-card">
            <IonCardHeader>
              <IonCardTitle>Choose How to Add Product</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="add-options">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="primary"
                  className="option-button ai-option"
                  onClick={() => setShowImageCapture(true)}
                >
                  <IonIcon icon={sparklesOutline} slot="start" />
                  Scan Product Image
                  <span className="option-subtitle">
                    AI extracts details automatically
                  </span>
                </IonButton>

                <div className="option-divider">
                  <span>or</span>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  className="option-button manual-option"
                  onClick={() => setShowManualForm(true)}
                >
                  <IonIcon icon={pencilOutline} slot="start" />
                  Enter Details Manually
                  <span className="option-subtitle">
                    Fill out the form yourself
                  </span>
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Image Capture Section */}
        {(showImageCapture || capturedImage) && !isEditMode && (
          <IonCard className="image-capture-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={sparklesOutline} />
                AI Product Scanner
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {!capturedImage ? (
                <div className="capture-section">
                  <div className="capture-placeholder">
                    <IonIcon icon={cameraOutline} />
                    <p>Take a photo or select from gallery</p>
                  </div>

                  <div className="capture-buttons">
                    <IonButton
                      expand="block"
                      fill="solid"
                      onClick={() => captureImage(CameraSource.Camera)}
                      disabled={isProcessing}
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Take Photo
                    </IonButton>

                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => captureImage(CameraSource.Photos)}
                      disabled={isProcessing}
                    >
                      <IonIcon icon={imagesOutline} slot="start" />
                      Choose from Gallery
                    </IonButton>
                  </div>
                </div>
              ) : (
                <div className="image-preview-section">
                  <div className="image-preview">
                    <img src={capturedImage} alt="Captured product" />
                  </div>

                  {isProcessing && (
                    <div className="processing-status">
                      <IonSpinner />
                      <p>AI is analyzing your image...</p>
                    </div>
                  )}

                  <div className="image-actions">
                    <IonButton
                      fill="clear"
                      color="medium"
                      onClick={() => {
                        setCapturedImage(null);
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
                      }}
                    >
                      Retake Photo
                    </IonButton>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Basic Information */}
        {(showManualForm || isEditMode) && (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Basic Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-field">
                  <label className="form-label required">Product Name</label>
                  <IonInput
                    className="form-input"
                    value={formData.name}
                    onIonInput={(e) =>
                      handleInputChange("name", e.detail.value!)
                    }
                    placeholder="Enter product name"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label required">Brand</label>
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
                  <label className="form-label">Description</label>
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
                  <label className="form-label">Size</label>
                  <IonInput
                    className="form-input"
                    value={formData.size}
                    onIonInput={(e) =>
                      handleInputChange("size", e.detail.value!)
                    }
                    placeholder="e.g., 2L, 500ml, 250g"
                  />
                </div>

                {/* Product Image Upload */}
                <div className="form-field">
                  <label className="form-label">Product Image</label>
                  {formData.imageUrl || capturedImage ? (
                    <div className="image-preview-section">
                      <div className="image-preview">
                        <img
                          src={capturedImage || formData.imageUrl}
                          alt="Product preview"
                        />
                      </div>
                      <div className="image-actions">
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={handleManualImageUpload}
                          disabled={isUploadingImage}
                        >
                          <IonIcon icon={imagesOutline} slot="start" />
                          {isUploadingImage ? "Uploading..." : "Change Image"}
                        </IonButton>
                        <IonButton
                          fill="clear"
                          color="medium"
                          size="small"
                          onClick={() => {
                            setCapturedImage(null);
                            setFormData((prev) => ({ ...prev, imageUrl: "" }));
                          }}
                        >
                          Remove
                        </IonButton>
                      </div>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <IonButton
                        fill="outline"
                        onClick={handleManualImageUpload}
                        disabled={isUploadingImage}
                      >
                        <IonIcon icon={imagesOutline} slot="start" />
                        {isUploadingImage
                          ? "Uploading..."
                          : "Add Product Image"}
                      </IonButton>
                      <p className="upload-note">
                        Optional: Add an image to help identify your product
                      </p>
                    </div>
                  )}
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
                  <label className="form-label required">Category</label>
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
                  <label className="form-label required">Subcategory</label>
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
                  <label className="form-label required">
                    Initial Quantity
                  </label>
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
                    onIonChange={(e) =>
                      handleInputChange("unit", e.detail.value)
                    }
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
          </>
        )}

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

      {(showManualForm || isEditMode) && (
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
      )}
    </IonPage>
  );
};

export default NewProduct;
