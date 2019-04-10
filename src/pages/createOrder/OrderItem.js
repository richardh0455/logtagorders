import React, { Component } from 'react';
import '../../public/css/gridforms.css';
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
    this.props.item.product_id = event.value;
    this.props.item.product_name = event.label;
    this.props.update_item_handler(this.props.item.key, this.props.item)
    this.setState({currentlySelectedProduct: event}, () =>
    {
      if(this.state.currentlySelectedProduct && this.props.customer)
      {
        this.getVariants();
      }
    })
  }


  handleVariantChange(event) {
	  this.setState({currentlySelectedVariant: event});
    this.handlePriceChange({target: {value: event.price}})
    this.props.item.variant_id = event.value;
    this.props.item.variant = event.label;
    this.props.update_item_handler(this.props.item.key, this.props.item)
  }

  async getVariants() {
	  var productID = this.state.currentlySelectedProduct.value;
	  var customerID = this.props.customer.value;
	  const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
		    queryStringParameters: {"CustomerID": customerID, "ProductID": productID}
      };
	  API.get(variantsAPI, getAllPath, apiRequest).then(response => {
        var variants = JSON.parse(response.body).map(
          function(variant, index){
            return {"value":variant.VariantID, "label":variant.Description, "price":variant.Price};
          }
        );
		    this.setState({variants: variants});
	  }).catch(error => {
		    console.log(error)
	});
  }

  handleQuantityChange(event) {
	this.setState({quantity: event.target.value});
  this.props.item.quantity = event.target.value;
  this.props.update_item_handler(this.props.item.key, this.props.item)
  }

  handlePriceChange(event) {
	  this.setState({price: event.target.value});
    this.props.item.price = event.target.value;
    this.props.update_item_handler(this.props.item.key, this.props.item)
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
				<input type="text" value={this.state.quantity} onChange={this.handleQuantityChange} />
			</div>
			<div data-field-span="1">
				<label>Pricing</label>
				<input type="text" value={this.state.price} onChange={this.handlePriceChange} />
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
