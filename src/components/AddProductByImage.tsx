import React, { useState } from "react";
import {
  IonButton,
  IonSpinner,
  IonInput,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
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
  title: string;
  brand: string;
  size: string;
  unit: string;
  category: string;
  subcategory: string;
  description: string;
  unitPrice: number;
  quantity: number;
  supplier: string;
  imageUrl: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  barcode?: string;
  confidence?: number;
  processing_time?: number;
}

interface ProductData {
  title: string;
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
    product: ProductData;
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
    title: "",
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
    showMessage("🤖 AI is analyzing your image...", "warning");

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
          title: product.title || "",
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
          `✅ Product details extracted successfully${confidenceText}`,
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
      formData.title &&
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
        title: formData.title,
        brand: formData.brand,
        size: formData.size,
        unit: formData.unit,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice || "0"),
        quantity: parseInt(formData.quantity || "0"),
        supplier: formData.supplier,
        imageUrl: downloadURL,
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

      showMessage("✅ Product saved successfully!", "success");

      // Reset form
      setCapturedImage(null);
      setFormData({
        title: "",
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
      {/* Image Capture Section */}
      <IonCard className="image-capture-card">
        <IonCardHeader>
          <IonCardTitle>
            {isProcessing ? (
              <>
                <IonSpinner name="dots" color="primary" />
                Processing Image...
              </>
            ) : (
              <>
                <IonIcon icon={cameraOutline} />
                Product Image
              </>
            )}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
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
                  AI Confidence: {Math.round(formData.confidence * 100)}%
                </div>
              )}
            </div>
          ) : (
            <div className="image-placeholder">
              <IonIcon
                icon={cameraOutline}
                style={{
                  fontSize: "48px",
                  color: "var(--ion-color-primary)",
                  marginBottom: "16px",
                }}
              />
              <h3
                style={{ margin: "0 0 8px 0", color: "var(--ion-color-dark)" }}
              >
                Capture Product Image
              </h3>
              <p
                style={{
                  color: "var(--ion-color-medium)",
                  margin: "0",
                  lineHeight: "1.5",
                }}
              >
                Take a photo or select from gallery to get AI-powered product
                details
              </p>
            </div>
          )}

          <IonButton
            expand="block"
            fill={capturedImage ? "outline" : "solid"}
            onClick={() => setShowActionSheet(true)}
            disabled={isProcessing}
            style={{ marginTop: "16px" }}
          >
            <IonIcon icon={cameraOutline} slot="start" />
            {capturedImage ? "Change Image" : "Add Image"}
          </IonButton>
        </IonCardContent>
      </IonCard>

      {/* Product Details Form */}
      {capturedImage && (
        <>
          {/* Basic Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Basic Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="form-field">
                <label className="form-label required">
                  Product Name
                  {formData.title && (
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
                  value={formData.title}
                  onIonInput={(e) =>
                    handleInputChange("title", e.detail.value!)
                  }
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-field">
                <label className="form-label required">
                  Brand
                  {formData.brand && (
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
                  {formData.description && (
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
                  {formData.size && (
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
                  {formData.category && (
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
                  onIonChange={(e) => {
                    handleInputChange("category", e.detail.value);
                    handleInputChange("subcategory", ""); // Reset subcategory
                  }}
                  placeholder="Select category"
                >
                  {categories.map((category) => (
                    <IonSelectOption
                      key={category.value}
                      value={category.value}
                    >
                      {category.value}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>

              <div className="form-field">
                <label className="form-label required">
                  Subcategory
                  {formData.subcategory && (
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
                  {getSubcategories().map((subcategory) => (
                    <IonSelectOption key={subcategory} value={subcategory}>
                      {subcategory}
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
                <label className="form-label">
                  Unit Type
                  {formData.unit && (
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
                  placeholder="Select unit"
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

          {/* AI Processing Info */}
          {formData.processing_time && (
            <IonCard>
              <IonCardContent>
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <IonIcon
                    icon={sparklesOutline}
                    style={{
                      marginRight: "8px",
                      color: "var(--ion-color-primary)",
                    }}
                  />
                  <small style={{ color: "var(--ion-color-medium)" }}>
                    AI processed in {formData.processing_time}s
                    {formData.confidence &&
                      ` • ${Math.round(formData.confidence * 100)}% confidence`}
                  </small>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <IonCard>
          <IonCardContent className="upload-progress-card">
            <IonSpinner
              name="crescent"
              color="primary"
              style={{ marginBottom: "16px" }}
            />
            <h3>Uploading Product...</h3>
            <p>{Math.round(uploadProgress)}% complete</p>
            <IonProgressBar value={uploadProgress / 100} />
          </IonCardContent>
        </IonCard>
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
