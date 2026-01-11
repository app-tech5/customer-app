
let userReducer = (state={}, action)=>{

    switch (action.type){

        case "ADD_USER": {
        return {...state, ...action.payload}
        }
        case "UPDATE_USER": {
            return {...state, ...action.payload}
            }
        case "SET_FAVORITES": {
            return {...state, favorites: action.payload}
            }
        case "ADD_FAVORITE": {
            const newFavorites = [...(state.favorites || []), action.payload];
            return {...state, favorites: newFavorites}
            }
        case "REMOVE_FAVORITE": {
            const newFavorites = (state.favorites || []).filter(id => id !== action.payload);
            return {...state, favorites: newFavorites}
            }
        default:
        return state
    }
}

export default userReducer;