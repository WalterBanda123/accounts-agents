import { IonToast } from '@ionic/react'
import React from 'react'

export interface ToastComponentInterface {
    isOpen: boolean,
    isError: boolean,
    message: string,
    duration: number
}
const ToastComponent: React.FC<ToastComponentInterface> = (props) => {
    return (
        <IonToast
            position='bottom'
            isOpen={props.isOpen}
            message={props.message}
            duration={props.duration}
            color={props.isError ? 'danger' : 'dark'}
        >
        </IonToast>
    )
}

export default ToastComponent