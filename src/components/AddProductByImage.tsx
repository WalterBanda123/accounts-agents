import React, { useState } from "react";
import {
  IonButton,
  IonSpinner,
  IonInput,
  IonContent,
  IonIcon,
  IonActionSheet,
  IonToast,
  IonProgressBar,
  IonTextarea,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  cameraOutline,
  imagesOutline,
  saveOutline,
  sparklesOutline,
} from "ionicons/icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { fAuth, fStore, fStorage } from "../../firebase.config";
import "./AddProductByImage.css";

interface ProductDocument {
  userId: string;
  name: string;
  brand: string;
  size: string;
  unit: string;
  category: string;
  subcategory: string;
  description: string;
  unitPrice: number;
  quantity: number;
  supplier: string;
  image: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  barcode?: string;
  confidence?: number;
  processing_time?: number;
}

interface ProductData {
  name: string;
  brand: string;
  size: string;
  unit: string;
  category: string;
  subcategory: string;
  description: string;
  unitPrice: string;
  quantity: string;
  supplier: string;
  barcode?: string;
  confidence?: number;
  processing_time?: number;
}

interface BackendResponse {
  message: string;
  status: string;
  data: {
    product: {
      title?: string;
      name?: string;
      brand?: string;
      size?: string;
      unit?: string;
      category?: string;
      subcategory?: string;
      description?: string;
      unitPrice?: string;
      quantity?: string;
      supplier?: string;
      barcode?: string;
      confidence?: number;
      processing_time?: number;
    };
    processing_method: string;
  };
  session_id: string | null;
}

const AddProductByImage: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");

  // Form data state
  const [formData, setFormData] = useState<ProductData>({
    name: "",
    brand: "",
    size: "",
    unit: "",
    category: "",
    subcategory: "",
    description: "",
    unitPrice: "",
    quantity: "",
    supplier: "",
    barcode: "",
  });

  // Categories and units
  const categories = [
    {
      value: "Food",
      subcategories: [
        "Snacks",
        "Baking Ingredients",
        "Condiments",
        "Canned Goods",
        "Grains & Rice",
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
      value: "Dairy",
      subcategories: ["Milk", "Cheese", "Yogurt", "Butter", "Cream", "Eggs"],
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
  ];

  const units = [
    "ml",
    "l",
    "g",
    "kg",
    "pieces",
    "packs",
    "bottles",
    "cans",
    "boxes",
  ];

  const auth = fAuth;
  const db = fStore;
  const storage = fStorage;

  const showMessage = (
    message: string,
    color: "success" | "danger" | "warning" = "success"
  ) => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
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
      showMessage("Failed to capture image", "danger");
    }
  };

  const processImageWithAI = async (imageDataUrl: string) => {
    setIsProcessing(true);
    showMessage("AI is analyzing your image...", "warning");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Convert data URL to base64 (remove data:image/jpeg;base64, prefix)
      const base64Data = imageDataUrl.split(",")[1];

      const requestBody = {
        message:
          "Analyze this product image and extract detailed product information including title, brand, size, unit, category, subcategory, description, and any visible pricing or supplier information. Focus on text visible on packaging and labels.",
        image_data: base64Data,
        is_url: false,
        user_id: currentUser.uid,
      };

      const response = await fetch("http://localhost:8003/analyze_image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Backend request failed: ${response.status} - ${response.statusText}`
        );
      }

      const backendResponse: BackendResponse = await response.json();

      if (
        backendResponse.status === "success" &&
        backendResponse.data &&
        backendResponse.data.product
      ) {
        const { product } = backendResponse.data;

        setFormData({
          name: product.title || product.name || "",
          brand: product.brand || "",
          size: product.size || "",
          unit: product.unit || "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          description: product.description || "",
          unitPrice: product.unitPrice || "",
          quantity: product.quantity || "",
          supplier: product.supplier || "",
          barcode: product.barcode || "",
          confidence: product.confidence,
          processing_time: product.processing_time,
        });

        const confidenceText = product.confidence
          ? ` (${Math.round(product.confidence * 100)}% confidence)`
          : "";
        showMessage(
          `Product details extracted successfully${confidenceText}`,
          "success"
        );
      } else {
        throw new Error(
          backendResponse.message || "Failed to extract product details"
        );
      }
    } catch (error) {
      console.error("Error processing image with AI:", error);
      showMessage(
        "Failed to process image with AI. Please fill in details manually.",
        "danger"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof ProductData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getSubcategories = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === formData.category
    );
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  const validateForm = () => {
    return (
      formData.name &&
      formData.brand &&
      formData.category &&
      formData.subcategory &&
      formData.unitPrice &&
      formData.quantity &&
      formData.supplier &&
      capturedImage
    );
  };

  const saveProduct = async () => {
    if (!validateForm()) {
      showMessage(
        "Please fill in all required fields (Product Name, Brand, Category, Subcategory, Unit Price, Quantity, Supplier) and capture an image",
        "warning"
      );
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      showMessage("User not authenticated", "danger");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique product ID
      const newProductId = `product_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Convert data URL to blob
      const response = await fetch(capturedImage!);
      const blob = await response.blob();

      // Upload image to Firebase Storage
      const storageRef = ref(
        storage,
        `products/${currentUser.uid}/${newProductId}.jpg`
      );
      const uploadTask = uploadBytesResumable(storageRef, blob);

      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          throw new Error("Failed to upload image");
        }
      );

      // Wait for upload to complete
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      // Save product data to Firestore
      const productDoc: Partial<ProductDocument> = {
        userId: currentUser.uid,
        name: formData.name,
        brand: formData.brand,
        size: formData.size,
        unit: formData.unit,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice || "0"),
        quantity: parseInt(formData.quantity || "0"),
        supplier: formData.supplier,
        image: downloadURL,
        createdAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (formData.barcode && formData.barcode.trim()) {
        productDoc.barcode = formData.barcode.trim();
      }

      if (formData.confidence !== undefined) {
        productDoc.confidence = formData.confidence;
      }

      if (formData.processing_time !== undefined) {
        productDoc.processing_time = formData.processing_time;
      }

      await addDoc(collection(db, "products"), productDoc);

      showMessage("Product saved successfully!", "success");

      // Reset form
      setCapturedImage(null);
      setFormData({
        name: "",
        brand: "",
        size: "",
        unit: "",
        category: "",
        subcategory: "",
        description: "",
        unitPrice: "",
        quantity: "",
        supplier: "",
        barcode: "",
      });
    } catch (error) {
      console.error("Error saving product:", error);
      showMessage("Failed to save product. Please try again.", "danger");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <IonContent className="add-product-content">
      {/* Header */}
      <div className="minimal-header">
        <IonButton 
          fill="clear" 
          className="back-button"
          onClick={() => window.history.back()}
        >
          <IonIcon icon={imagesOutline} />
        </IonButton>
        <h1>Add New Product</h1>
      </div>

      {/* Image Upload Section */}
      <div className="image-upload-card">
        {capturedImage ? (
          <div className="image-preview">
            <img src={capturedImage} alt="Product" />
            {formData.confidence && (
              <div
                className={`confidence-indicator ${
                  formData.confidence > 0.7
                    ? "confidence-high"
                    : formData.confidence > 0.4
                    ? "confidence-medium"
                    : "confidence-low"
                }`}
              >
                <IonIcon icon={sparklesOutline} />
                {Math.round(formData.confidence * 100)}%
              </div>
            )}
            <IonButton
              expand="block"
              fill="outline"
              className="change-image-button"
              onClick={() => setShowActionSheet(true)}
              disabled={isProcessing}
            >
              <IonIcon icon={cameraOutline} slot="start" />
              Change Image
            </IonButton>
          </div>
        ) : (
          <div className="image-placeholder" onClick={() => setShowActionSheet(true)}>
            <div className="placeholder-content">
              <IonIcon icon={cameraOutline} className="placeholder-icon" />
              <h3>Add Product Photo</h3>
              <p>Take a photo and AI will extract product details automatically</p>
            </div>
            <IonButton
              expand="block"
              className="upload-button"
              onClick={() => setShowActionSheet(true)}
              disabled={isProcessing}
            >
              <IonIcon icon={cameraOutline} slot="start" />
              Add Image
            </IonButton>
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="processing-banner">
          <div className="processing-content">
            <IonSpinner name="dots" color="primary" />
            <div className="processing-text">
              <h3>Analyzing image with AI...</h3>
              <p>This may take a few seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Form */}
      {capturedImage && (
        <>
          {/* AI Info Banner */}
          <div className="ai-success-banner">
            <div className="ai-success-content">
              <IonIcon icon={sparklesOutline} className="success-icon" />
              <div className="success-text">
                <h3>AI Analysis Complete</h3>
                <p>Review and complete the extracted details below</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-card">
            <h2 className="form-card-title">Basic Information</h2>
            
            <div className={`form-field ${formData.name ? 'ai-populated-field' : ''}`}>
              <label className="form-label required">
                Product Name
                {formData.name && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.name}
                onIonInput={(e) => handleInputChange("name", e.detail.value!)}
                placeholder="Enter product name"
              />
            </div>

            <div className={`form-field ${formData.brand ? 'ai-populated-field' : ''}`}>
              <label className="form-label required">
                Brand
                {formData.brand && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.brand}
                onIonInput={(e) => handleInputChange("brand", e.detail.value!)}
                placeholder="Enter brand name"
              />
            </div>

            <div className={`form-field ${formData.description ? 'ai-populated-field' : ''}`}>
              <label className="form-label">
                Description
                {formData.description && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonTextarea
                className="form-textarea"
                value={formData.description}
                onIonInput={(e) => handleInputChange("description", e.detail.value!)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className={`form-field ${formData.size ? 'ai-populated-field' : ''}`}>
              <label className="form-label">
                Size
                {formData.size && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonInput
                className="form-input"
                value={formData.size}
                onIonInput={(e) => handleInputChange("size", e.detail.value!)}
                placeholder="e.g., 2L, 500ml, 250g"
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-card">
            <h2 className="form-card-title">Category</h2>
            
            <div className={`form-field ${formData.category ? 'ai-populated-field' : ''}`}>
              <label className="form-label required">
                Category
                {formData.category && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonSelect
                className="form-select"
                value={formData.category}
                onIonChange={(e) => {
                  handleInputChange("category", e.detail.value);
                  handleInputChange("subcategory", "");
                }}
                placeholder="Select category"
              >
                {categories.map((category) => (
                  <IonSelectOption key={category.value} value={category.value}>
                    {category.value}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className={`form-field ${formData.subcategory ? 'ai-populated-field' : ''}`}>
              <label className="form-label required">
                Subcategory
                {formData.subcategory && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonSelect
                className="form-select"
                value={formData.subcategory}
                onIonChange={(e) => handleInputChange("subcategory", e.detail.value)}
                placeholder="Select subcategory"
                disabled={!formData.category}
              >
                {getSubcategories().map((subcategory) => (
                  <IonSelectOption key={subcategory} value={subcategory}>
                    {subcategory}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="form-card">
            <h2 className="form-card-title">Pricing & Inventory</h2>
            
            <div className="form-field">
              <label className="form-label required">Unit Price</label>
              <IonInput
                className="form-input"
                type="number"
                value={formData.unitPrice}
                onIonInput={(e) => handleInputChange("unitPrice", e.detail.value!)}
                placeholder="0.00"
              />
            </div>

            <div className="form-field">
              <label className="form-label required">Initial Quantity</label>
              <IonInput
                className="form-input"
                type="number"
                value={formData.quantity}
                onIonInput={(e) => handleInputChange("quantity", e.detail.value!)}
                placeholder="0"
              />
            </div>

            <div className={`form-field ${formData.unit ? 'ai-populated-field' : ''}`}>
              <label className="form-label">
                Unit Type
                {formData.unit && (
                  <IonIcon icon={sparklesOutline} className="ai-indicator" title="Auto-filled by AI" />
                )}
              </label>
              <IonSelect
                className="form-select"
                value={formData.unit}
                onIonChange={(e) => handleInputChange("unit", e.detail.value)}
                placeholder="Select unit"
              >
                {units.map((unit) => (
                  <IonSelectOption key={unit} value={unit}>
                    {unit}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-card">
            <h2 className="form-card-title">Additional Information</h2>
            
            <div className="form-field">
              <label className="form-label required">Supplier</label>
              <IonInput
                className="form-input"
                value={formData.supplier}
                onIonInput={(e) => handleInputChange("supplier", e.detail.value!)}
                placeholder="Enter supplier name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Barcode (Optional)</label>
              <IonInput
                className="form-input"
                value={formData.barcode}
                onIonInput={(e) => handleInputChange("barcode", e.detail.value!)}
                placeholder="Enter barcode"
              />
            </div>
          </div>

          {/* AI Processing Info */}
          {formData.processing_time && (
            <div className="ai-info-card">
              <div className="ai-stats">
                <IonIcon icon={sparklesOutline} />
                <span>
                  AI processed in {formData.processing_time}s
                  {formData.confidence && ` • ${Math.round(formData.confidence * 100)}% confidence`}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="upload-progress-card">
          <IonSpinner name="crescent" color="primary" style={{ marginBottom: "16px" }} />
          <h3>Uploading Product...</h3>
          <p>{Math.round(uploadProgress)}% complete</p>
          <IonProgressBar value={uploadProgress / 100} />
        </div>
      )}

      {/* Save Button */}
      {capturedImage && !isProcessing && (
        <IonButton
          expand="block"
          onClick={saveProduct}
          disabled={!validateForm() || isUploading}
          className="save-product-btn"
        >
          <IonIcon icon={saveOutline} slot="start" />
          {isUploading ? "Saving..." : "Save Product"}
        </IonButton>
      )}

      {/* Action Sheet for Image Selection */}
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
        mode="ios"
      />

      {/* Toast Messages */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
        color={toastColor}
      />
    </IonContent>
  );
};

export default AddProductByImage;
