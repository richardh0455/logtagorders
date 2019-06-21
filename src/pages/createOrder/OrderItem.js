import React, { Component } from 'react';
import '../../public/css/gridforms.css';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';

const variantsAPI = 'VariantsAPI';
const getAllPath = '/all';

const customerAPI = 'CustomersAPI';


class OrderItem extends Component {
  constructor(props) {
    super(props);
	var order_item = null;
    this.state = {
		variant: order_item ? order_item.variant : this.props.item.variant,
		variant_id: order_item ? order_item.variant_id : this.props.item.variant_id,
		quantity: order_item ? order_item.quantity : this.props.item.quantity,
		price: order_item ? order_item.price : this.props.item.price,
		variants: [],
    priceList: [],
    inputHeight: '38px'
	};

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }

  handleProductChange = (event) => {
    this.props.item.product_id = event.value;
    this.props.item.product_name = event.label;
    this.props.update_item_handler(this.props.item.key, this.props.item)
    this.setState({currentlySelectedProduct: event}, () =>
    {
      if(this.state.currentlySelectedProduct && this.props.customer)
      {
        this.getVariants();
        this.getPriceList();
      }
    })
  }


  handleVariantChange = (event) => {
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

  getPriceList = () => {
    var productID = this.state.currentlySelectedProduct.value;
	  var customerID = this.props.customer.value;
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': productID,
        'variant-id': this.state.currentlySelectedVariant ? this.state.currentlySelectedVariant.value : ''
      }
    };
    //this.setState({currentlySelectedCustomerID:id})
    API.get(customerAPI, '/'+customerID+'/price-list', apiRequest)
    .then(response => {
      this.setState({priceList: JSON.parse(response.body)
        .map(item => {
          return {'lower_range':item.Lower_Range, 'upper_range':item.Upper_Range, 'price':item.Price, 'ID':item.ID}})
        .sort(function(a, b) {
          return a.upper_range - b.upper_range;
        })
      })
      //console.log(JSON.parse(response.body))
    })
  }

  handleQuantityChange = (event) => {
    var quantity = event.target.value;
	   this.setState({quantity: quantity});
     this.props.item.quantity = quantity;
     this.props.update_item_handler(this.props.item.key, this.props.item)

     var quantityInt = parseInt(quantity)
     var minPrice = this.state.priceList.length > 0 && this.state.priceList.reduce(
       (min, item) =>
          quantityInt >= parseInt(item.lower_range)
          && quantityInt <= parseInt(item.upper_range)
          &&  parseFloat(item.price) < parseFloat(min.price)
          ? item : min);
     if(quantityInt >= parseInt(minPrice.lower_range) && quantityInt <= parseInt(minPrice.upper_range))
     {
       this.handlePriceChange({target:{value:minPrice.price}})
     }
  }

  handlePriceChange = (event) => {
    var price = event.target.value.replace('$', '').trim()
	  this.setState({price: price});
    this.props.item.price = price;
    this.props.update_item_handler(this.props.item.key, this.props.item)
  }



  removeItem = (event) => {
	event.preventDefault();
	this.props.update_item_handler(this.props.item.key, null)
  }

  onKeyPress = (event) => {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }

  render() {
    return (
      <div onKeyPress={this.onKeyPress}>
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
				<input type="text" value={this.state.quantity} style={{'height': this.state.inputHeight}} onChange={this.handleQuantityChange} />
			</div>
			<div data-field-span="1">
				<label>Pricing</label>
				<input type="text" value={this.state.price} style={{'height': this.state.inputHeight}} onChange={this.handlePriceChange} />
			</div>

			<div data-field-span="1">
				<label>Subtotal</label>
				<span style={{'height': this.state.inputHeight, 'fontSize':'18px'}}> {(this.state.quantity * this.state.price).toFixed(2)} </span>
			</div>
			<div data-field-span="1" >
				<button onClick={this.removeItem}  >Remove Item</button>
			</div>

		</div>
	  </div>
    );
  }
}

export default OrderItem;
