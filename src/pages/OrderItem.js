import React, { Component } from 'react';
import '../public/css/gridforms.css';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';

const variantsAPI = 'VariantsAPI';
const getAllPath = '/all';


class OrderItem extends Component {
  constructor(props) {
    super(props);
	var order_item = null; /*JSON.parse(localStorage.getItem(this.props.item.key));*/
    this.state = {
		variant: order_item ? order_item.variant : this.props.item.variant, 
		variant_id: order_item ? order_item.variant_id : this.props.item.variant_id, 
		quantity: order_item ? order_item.quantity : this.props.item.quantity, 
		price: order_item ? order_item.price : this.props.item.price,
		variants: []
	};

    this.handleProductChange = this.handleProductChange.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handlePriceChange = this.handlePriceChange.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
  }	
  
  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });

    
  }
  
  handleProductChange(event) {
    this.setState({currentlySelectedProduct: event})
  }
  
  
  handleVariantChange(event) {
	this.setState({currentlySelectedVariant: event});  
  }
  
  async getVariants() {
	  var productID = this.state.currentlySelectedProduct.value;
	  var customerID = this.props.customer.value;
	  const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        }, 
		body: {"CustomerID": customerID, "ProductID": productID}
      };
	  API.get(variantsAPI, getAllPath, apiRequest).then(response => {
		this.setState({variants: response.body});
	  }).catch(error => {
		console.log(error.response)
	});
  }
  
  handleQuantityChange(event) {
	this.saveState({quantity: event.target.value});  
  }
  
  handlePriceChange(event) {  
	this.saveState({price: event.target.value});  
  }
  
  removeItem(event) {
	event.preventDefault();
	this.props.update_item_handler(this.props.item.key, null)
  }
  
  onKeyPress(event) {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }
  

  
  saveState(state) {
	this.setState(state)   
	var order_item  = {variant: this.state.variant,variant_id: this.state.variant_id, quantity: this.state.quantity, price: this.state.price}
	for(var key in state){
      order_item[key] = state[key];
	} 
	this.props.update_item_handler(this.props.item.key, order_item)
   }
	
  render() { 
    return (
      <div className onKeyPress={this.onKeyPress}>
        <div data-row-span="6">
			<div data-field-span="1">
				<label>Product</label>
				<Select value={this.state.currentlySelectedProduct} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
			</div>
			<div data-field-span="1">
				<label>Variant</label>
				<Select value={this.state.currentlySelectedVariant} onChange={this.handleVariantChange} options={this.state.variants} isSearchable="true" placeholder="Select a Variant"/>
			</div>
			<div data-field-span="1">
				<label>Quantity</label>
				<input type="text" defaultValue={this.state.quantity} onChange={this.handleQuantityChange} />
			</div>
			<div data-field-span="1">
				<label>Pricing</label>
				<input type="text" defaultValue={this.state.price} onChange={this.handlePriceChange} />
			</div>
			<div data-field-span="1">
				<label>Subtotal</label>
				{this.state.quantity * this.state.price}
			</div>
			<div data-field-span="1">
				<button onClick={this.removeItem}  >Remove Item</button>
			</div>
			
		</div>
	  </div>
    );
  }
}

export default OrderItem;