import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonButton,
  IonModal,
  IonSearchbar,
} from "@ionic/react";
import {
  cubeOutline,
  chatbubbleEllipsesOutline,
  add,
  pencilOutline,
  refreshOutline,
  cameraOutline,
} from "ionicons/icons";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useHistory } from "react-router-dom";
import { StockItem } from "../mock/stocks";
import StockCard from "../components/StockCard";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import "../components/StockCard.css";
import "./Stocks.css";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";

const Stocks: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<Partial<StockItem> | null>(
    null
  );
  const [searchText, setSearchText] = useState<string>("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const modal = useRef<HTMLIonModalElement>(null);
  const history = useHistory();
  const { getAllProducts, inventory, isProductsLoading } = useDataContext();
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await getAllProducts();
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    if (inventory.length === 0) {
      fetchProducts();
    }
  }, [getAllProducts, inventory.length]);

  const handleRefresh = useCallback(async () => {
    try {
      await getAllProducts();
    } catch (error) {
      console.error("Failed to refresh products:", error);
    }
  }, [getAllProducts]);

  const getTotalValue = useMemo(() => {
    return inventory?.reduce(
      (total, item) => total + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );
  }, [inventory]);

  const filteredStocks = useMemo(() => {
    if (!searchText) return inventory;

    const searchLower = searchText.toLowerCase();
    return inventory?.filter(
      (stock) =>
        stock.name?.toLowerCase().includes(searchLower) ||
        stock.brand?.toLowerCase().includes(searchLower) ||
        stock?.category?.toLowerCase().includes(searchLower) ||
        stock?.description?.toLowerCase().includes(searchLower) ||
        stock?.subcategory?.toLowerCase().includes(searchLower)
    );
  }, [inventory, searchText]);

  const handleStockClick = useCallback((stock: Partial<StockItem>) => {
    setSelectedStock(stock);
    modal.current?.present();
  }, []);

  const handleRestock = useCallback(
    (product: Partial<StockItem>) => {
      modal.current?.dismiss();
      history.push("/my_assistant", {
        action: "restock",
        productName: product.name,
        context: `Restocking ${product.name} (${product.brand}) - Current stock: ${product.quantity} ${product.unit}`,
      });
    },
    [history]
  );

  const handleEditProduct = useCallback(
    (product: Partial<StockItem>) => {
      modal.current?.dismiss();
      history.push("/new-product", {
        editMode: true,
        productData: product,
      });
    },
    [history]
  );

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  }, []);

  const totalInventoryValue = getTotalValue;

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color={"dark"} defaultHref="/" />
          </IonButtons>
          <IonTitle>Stock Overview</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleProfileClick}>
              <InitialsAvatar
                name={user?.name || "User"}
                size="small"
                className="header-avatar"
              />
            </IonButton>
            <IonButton
              fill="clear"
              color="primary"
              onClick={handleRefresh}
              disabled={isProductsLoading}
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
            <IonButton
              fill="clear"
              color="primary"
              onClick={() => history.push("/my_assistant")}
            >
              <IonIcon icon={chatbubbleEllipsesOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Stock Overview</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Search Section */}
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            debounce={300}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search inventory..."
            mode="md"
            className="search-bar"
          />
        </div>

        {/* Condensed Header */}
        <div className="stocks-condensed-header">
          <div className="header-content">
            <div className="header-icon">
              <IonIcon icon={cubeOutline} />
            </div>
            <div className="header-text">
              <h2>Inventory</h2>
              <p>
                {filteredStocks?.length} of {inventory?.length} items • $
                {totalInventoryValue?.toLocaleString()} total value
              </p>
            </div>
            <IonButton
              fill="clear"
              color="primary"
              onClick={() => history.push("/my_assistant")}
              className="chat-button"
            >
              <IonIcon icon={chatbubbleEllipsesOutline} size="large" />
            </IonButton>
          </div>
        </div>

        {/* Stock List */}
        <div className="simple-stock-list">
          {isProductsLoading && inventory.length === 0 ? (
            <div className="loading-state">
              <p>Loading inventory...</p>
            </div>
          ) : (
            <>
              {filteredStocks?.map((stock: Partial<StockItem>) => (
                <div key={stock?.id} onClick={() => handleStockClick(stock)}>
                  <StockCard stock={stock} compact={true} />
                </div>
              ))}

              {filteredStocks?.length === 0 && inventory.length > 0 && (
                <div className="no-stocks">
                  <p>No items found matching "{searchText}"</p>
                </div>
              )}

              {!isProductsLoading && inventory.length === 0 && (
                <div className="no-stocks">
                  <p>No inventory items found. Add your first product!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Product FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            color="primary"
            onClick={() => history.push("/new-product")}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Product Detail Modal */}
        <IonModal ref={modal} mode="ios">
          <IonHeader mode="ios">
            <IonToolbar>
              <IonTitle>Product Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => modal.current?.dismiss()}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedStock && (
              <div className="product-detail">
                {/* Product Image Section */}
                <div className="detail-section product-image-section">
                  <div className="product-image-container">
                    {selectedStock.image ? (
                      <img
                        src={selectedStock.image}
                        alt={selectedStock.name}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <IonIcon icon={cameraOutline} />
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{selectedStock.name}</h3>
                  <p className="brand">{selectedStock.brand}</p>
                  <p className="description">{selectedStock.description}</p>
                </div>

                <div className="detail-section">
                  <h4>Category</h4>
                  <p>
                    {selectedStock.category} → {selectedStock.subcategory}
                  </p>
                </div>

                <div className="detail-section">
                  <h4>Pricing & Inventory</h4>
                  <p>
                    <strong>Unit Price:</strong> ${selectedStock.unitPrice}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {selectedStock.quantity}{" "}
                    {selectedStock.unit}
                  </p>
                  <p>
                    <strong>Size:</strong> {selectedStock.size}
                  </p>
                  <p>
                    <strong>Total Value:</strong> $
                    {(
                      selectedStock.unitPrice! * selectedStock.quantity!
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="detail-section">
                  <h4>Additional Info</h4>
                  <p>
                    <strong>Status:</strong>
                    <span
                      style={{
                        marginLeft: "8px",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        backgroundColor:
                          selectedStock.status === "in-stock"
                            ? "#d4edda"
                            : selectedStock.status === "low-stock"
                            ? "#fff3cd"
                            : "#f8d7da",
                        color:
                          selectedStock.status === "in-stock"
                            ? "#155724"
                            : selectedStock.status === "low-stock"
                            ? "#856404"
                            : "#721c24",
                      }}
                    >
                      {selectedStock.status === "in-stock"
                        ? "✅ In Stock"
                        : selectedStock.status === "low-stock"
                        ? "⚠️ Low Stock"
                        : "❌ Out of Stock"}
                    </span>
                  </p>
                  <p>
                    <strong>Last Restocked:</strong>{" "}
                    {selectedStock.lastRestocked}
                  </p>
                  <p>
                    <strong>Supplier:</strong> {selectedStock.supplier}
                  </p>
                  {selectedStock.barcode && (
                    <p>
                      <strong>Barcode:</strong> {selectedStock.barcode}
                    </p>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Quick Actions</h4>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--ion-color-medium)",
                      marginBottom: "16px",
                    }}
                  >
                    💬 <strong>Restock with AI:</strong> Our AI assistant can
                    help you restock this item using natural language. Just tell
                    it what you need, like "Add 50 bottles" or "Restock 20
                    units".
                  </p>
                  <IonButton
                    expand="block"
                    fill="solid"
                    color="primary"
                    onClick={() => handleRestock(selectedStock)}
                  >
                    <IonIcon icon={refreshOutline} slot="start" />
                    Restock with AI Assistant
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    style={{ marginTop: "8px" }}
                    onClick={() => handleEditProduct(selectedStock)}
                  >
                    <IonIcon icon={pencilOutline} slot="start" />
                    Edit Product Details
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />
    </IonPage>
  );
};

export default Stocks;
