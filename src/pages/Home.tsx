import {
  IonButton,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

import {
  cameraOutline,
  chatbubblesOutline,
  cubeOutline,
  documentAttachOutline,
} from "ionicons/icons";
import "./Home.css";
import RecentTransactionCard from "../components/RecentTransactionCard";
import "../components/RecentTransactionCard.css";
import { ALL_TRANSACTIONS } from "../mock/transactions";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";

import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { PhotoInterface } from "../interfaces/photo";
import ToastComponent from "../components/ToastComponent";

const Home: React.FC = () => {


  const PHOTO_STORAGE: string = 'photos';
  const [photos, setPhotos] = useState<PhotoInterface[]>([])
  const [toastError, setToastError] = useState<string>("")

  const history = useHistory();

  const convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  const readAsBase64 = async (photo: Photo) => {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return await convertBlobToBase64(blob) as string;
  }

  const savePhoto = async (photo: Photo) => {
    const base64Data = await readAsBase64(photo);

    const fileName = Date.now() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filePath: fileName,
      webviewPath: photo.webPath
    };
  }

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });

      const savedPhoto = await savePhoto(photo);

      const updatedPhotos = [savedPhoto, ...photos];
      setPhotos(updatedPhotos);
      Preferences.set({
        key: PHOTO_STORAGE,
        value: JSON.stringify(updatedPhotos),
      })

      //use photo not saved photo
    } catch (error: unknown) {
      console.error(error);
      setToastError('Failed to take photo')
    }
  }

  const deletePhoto = async (photo: PhotoInterface, position: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(position, 1);
    setPhotos(updatedPhotos);

    Preferences.set({
      key: PHOTO_STORAGE,
      value: JSON.stringify(updatedPhotos)
    });

    const filename = photo.filePath
      .substring(photo.filePath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }



  // Calculate today's sales metrics
  const todaysTransactions = ALL_TRANSACTIONS.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const todayDate = new Date();
    return transactionDate.toDateString() === todayDate.toDateString();
  });

  const todaysRevenue = todaysTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
  const itemsSoldToday = todaysTransactions.reduce(
    (sum, transaction) => sum + transaction.cartItems.length,
    0
  );

  // Get the most recent 5 transactions
  const recentTransactions = ALL_TRANSACTIONS.sort(
    (a, b) =>
      new Date(b.date + " " + b.time).getTime() -
      new Date(a.date + " " + a.time).getTime()
  ).slice(0, 5);

  const navigateToReceipts = () => {
    history.push("/receipts");
  };

  const navigateToStockOverview = () => {
    history.push("/stock-overview");
  };

  return (
    <React.Fragment>
     
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense" mode="ios">
            <IonToolbar>
              <IonTitle size="large">Welcome</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonGrid>
            <IonRow>
              <IonCol>
                <div
                  className="container scan-cart-highlighted"
                  onClick={takePhoto}
                >
                  <IonCol size="2">
                    <IonIcon icon={cameraOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Scan Cart</h2>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container" onClick={navigateToReceipts}>
                  <IonCol size="2">
                    <IonIcon icon={documentAttachOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>View Receipts</h2>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container" onClick={navigateToStockOverview}>
                  <IonCol size="2">
                    <IonIcon icon={cubeOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Stock Overview</h2>
                      <p className="sales-info">
                        {todaysTransactions.length} sales today •{" "}
                        {itemsSoldToday} items sold
                      </p>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="section-header">
                  <IonLabel>
                    <h2>Recent Transactions</h2>
                    <p>Your latest financial activity</p>
                  </IonLabel>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="recent-transactions-container">
                  {recentTransactions.map((transaction) => (
                    <RecentTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      compact={true}
                    />
                  ))}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow class="ion-text-center">
              <IonCol>
                <IonButton
                  mode="ios"
                  fill="outline"
                  color="primary"
                  routerLink="/receipts"
                  routerDirection="forward"
                >
                  View All Transactions • ${todaysRevenue.toFixed(2)} today
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton
              color={"primary"}
              routerLink="/my_assistant"
              routerDirection="forward"
            >
              <IonIcon icon={chatbubblesOutline} />
            </IonFabButton>
          </IonFab>
          <ToastComponent
            message={toastError}
            duration={3000}
            isError={!!toastError}
            isOpen={!!toastError}
          />
        </IonContent>
      </IonPage>
    </React.Fragment>
  );
};

export default Home;
