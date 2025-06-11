import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from "@ionic/react";
import {
  sparklesOutline,
  cameraOutline,
  createOutline,
  saveOutline,
  cogOutline,
} from "ionicons/icons";
import AddProductByImage from "../components/AddProductByImage";
import "./AddProductByImageDemo.css";

const AddProductByImageDemo: React.FC = () => {
  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/stock-overview" />
          </IonButtons>
          <IonTitle>Add Product by Image</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Add Product by Image</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Instructions Card */}
        <IonCard className="instructions-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={sparklesOutline} />
              How it works
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ol className="instructions-list">
              <li>
                <IonIcon icon={cameraOutline} />{" "}
                <strong>Capture or select</strong> a product image
              </li>
              <li>
                <IonIcon icon={cogOutline} /> <strong>AI analyzes</strong> the
                image to extract product details
              </li>
              <li>
                <IonIcon icon={createOutline} />{" "}
                <strong>Review and edit</strong> the extracted information
              </li>
              <li>
                <IonIcon icon={saveOutline} /> <strong>Save</strong> the product
                to your inventory
              </li>
            </ol>
            <p className="instructions-note">
              The AI will automatically detect product title, size, category,
              and other details from your image.
            </p>
          </IonCardContent>
        </IonCard>

        {/* Add Product Component */}
        <AddProductByImage />
      </IonContent>
    </IonPage>
  );
};

export default AddProductByImageDemo;
