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
} from "@ionic/react";
import { saveOutline, cameraOutline } from "ionicons/icons";
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
          });
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
                  onIonInput={(e) => handleInputChange("name", e.detail.value!)}
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
                <label className="form-label">Unit</label>
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
      </IonContent>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
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
