import { IonRow, IonCol, IonLabel } from "@ionic/react";
import React from "react";
import './Receipt.css'

export interface ReceiptComponentInterface {
    invoice: string,
    amount: number,
    date: string,
    status: 'Unpaid' | 'Paid'
}

const ReceiptComponent: React.FC<ReceiptComponentInterface> = (props) => {
    return (
        <div className="receipt">
            <IonRow>
                <IonCol>
                    <IonLabel>
                        <strong>{props.invoice}</strong>
                    </IonLabel>
                </IonCol>
                <IonCol className='ion-text-end'>
                    <IonLabel>
                        <strong>$ {props.amount}</strong>
                    </IonLabel>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol>
                    {new Date().toDateString()}
                </IonCol>
                <IonCol className='ion-text-end'>{props.status}</IonCol>
            </IonRow>
        </div>
    )
}

export default ReceiptComponent