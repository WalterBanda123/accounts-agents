import React, { useState } from 'react'
import DataContext from './DataContext'
import { StockItem } from '../../mock/stocks'

const DataContextProvider:React.FC<{children:React.ReactNode}> = (props) => {

    const [inventory, setInventory] = useState<StockItem[]>([])
    const addNewProduct = async(product:Partial<StockItem>) =>{
        setInventory([])
        return Promise.resolve(product)
    }

    const getProduct = async(productId:string) =>{
        console.log(productId)
        return {}
    }

  return (
    <DataContext.Provider value={{
        addNewProduct,
        getProduct,
        inventory
    }}>
        {props.children}
    </DataContext.Provider>
  )
}

export default DataContextProvider