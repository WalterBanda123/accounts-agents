import React from 'react'
import DataContext from './DataContext'

export const useDataContext = () => {
    const dataContext = React.useContext(DataContext)
    if (!dataContext) {
        throw Error("No data context found!")
    }
    return dataContext
}
