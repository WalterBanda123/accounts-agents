import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
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
} from "@ionic/react";
import { saveOutline, cameraOutline } from "ionicons/icons";
import { StockItem } from "../mock/stocks";
import ProfilePopover from "../components/ProfilePopover";
import "./NewProduct.css";

interface LocationState {
  editMode?: boolean;
  productData?: StockItem;
}

const NewProduct: React.FC = () => {
  const location = useLocation<LocationState>();
  const isEditMode = location.state?.editMode || false;
  const existingProduct = location.state?.productData;

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
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);

  const categories = [
    {
      value: "Beverages",
      subcategories: ["Soft Drinks", "Juices", "Water", "Energy Drinks"],
    },
    { value: "Snacks", subcategories: ["Chips", "Cookies", "Nuts", "Candy"] },
    { value: "Dairy", subcategories: ["Milk", "Cheese", "Yogurt", "Butter"] },
    {
      value: "Bakery",
      subcategories: ["Bread", "Pastries", "Cakes", "Cookies"],
    },
    {
      value: "Household",
      subcategories: ["Cleaning", "Personal Care", "Paper Products"],
    },
  ];

  const units = [
    "pieces",
    "bottles",
    "cans",
    "kg",
    "g",
    "liters",
    "ml",
    "boxes",
    "packs",
  ];

  // Populate form data when editing existing product
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
      });
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
      subcategory: "", // Reset subcategory when category changes
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

  const handleSave = () => {
    if (!validateForm()) {
      setToastMessage("Please fill in all required fields");
      setShowToast(true);
      return;
    }

    // Here you would typically save to your data store
    // For now, we'll just show a success message
    const productData: Partial<StockItem> = {
      id: isEditMode ? existingProduct?.id : `STK${Date.now()}`, // Use existing ID if editing
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
    };

    console.log(isEditMode ? "Updated Product:" : "New Product:", productData);
    setToastMessage(
      isEditMode
        ? "Product updated successfully!"
        : "Product added successfully!"
    );
    setShowToast(true);

    // Reset form only if adding new product
    if (!isEditMode) {
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
        });
      }, 1000);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
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
            <IonButton
              onClick={handleSave}
              disabled={!validateForm()}
              strong={true}
            >
              <IonIcon icon={saveOutline} slot="start" />
              {isEditMode ? "Update" : "Save"}
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
        {/* Product Image Section */}
        <IonCard className="image-upload-card">
          <IonCardContent>
            <div className="image-upload-section">
              <div className="image-placeholder">
                <IonIcon icon={cameraOutline} size="large" />
                <p>Add Product Image</p>
                <IonButton fill="outline" size="small">
                  Choose Image
                </IonButton>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonList>
          {/* Basic Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Basic Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Product Name *</IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) => handleInputChange("name", e.detail.value!)}
                  placeholder="Enter product name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Brand *</IonLabel>
                <IonInput
                  value={formData.brand}
                  onIonInput={(e) =>
                    handleInputChange("brand", e.detail.value!)
                  }
                  placeholder="Enter brand name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={formData.description}
                  onIonInput={(e) =>
                    handleInputChange("description", e.detail.value!)
                  }
                  placeholder="Enter product description"
                  rows={3}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Size</IonLabel>
                <IonInput
                  value={formData.size}
                  onIonInput={(e) => handleInputChange("size", e.detail.value!)}
                  placeholder="e.g., 2L, 500ml, 250g"
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Category */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Category</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Category *</IonLabel>
                <IonSelect
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
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Subcategory *</IonLabel>
                <IonSelect
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
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Pricing & Inventory */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Pricing & Inventory</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Unit Price *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.unitPrice}
                  onIonInput={(e) =>
                    handleInputChange("unitPrice", e.detail.value!)
                  }
                  placeholder="0.00"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Initial Quantity *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.quantity}
                  onIonInput={(e) =>
                    handleInputChange("quantity", e.detail.value!)
                  }
                  placeholder="0"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonSelect
                  value={formData.unit}
                  onIonChange={(e) => handleInputChange("unit", e.detail.value)}
                >
                  {units.map((unit) => (
                    <IonSelectOption key={unit} value={unit}>
                      {unit}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Additional Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Additional Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Supplier *</IonLabel>
                <IonInput
                  value={formData.supplier}
                  onIonInput={(e) =>
                    handleInputChange("supplier", e.detail.value!)
                  }
                  placeholder="Enter supplier name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Barcode (Optional)</IonLabel>
                <IonInput
                  value={formData.barcode}
                  onIonInput={(e) =>
                    handleInputChange("barcode", e.detail.value!)
                  }
                  placeholder="Enter barcode"
                />
              </IonItem>
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
      </IonContent>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />
    </IonPage>
  );
};

export default NewProduct;
