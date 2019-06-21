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
    this.state = {
		//variant: product ? product.variant : this.props.item.variant,
		//variant_id: this.props.item.variant_id,
		//quantity: this.props.item.quantity,
		//price: this.props.item.price,
		variants: [],
    priceList: [],
    inputHeight:'38px'
	};


  }

  async componentDidMount() {

    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
    if(this.props.product && this.props.customer)
    {
      this.getVariants(this.props.product.value);
      this.getPriceList(this.props.product.value);
    }

  }


  handleProductChange = (event) => {
    this.props.update_item_handler(this.props.id, 'ProductID', event.value)
    this.getVariants(event.value);
    this.getPriceList(event.value, null);

  }


  handleVariantChange = (event) => {
	  this.props.update_item_handler(this.props.id, 'VariationID', event.value)
    this.getPriceList(this.props.product.value, event.value);
  }

  async getVariants(productID) {
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

  async getPriceList(productID, variantID) {
    if(!productID)
    {
      return;
    }
    if(!variantID)
    {
      variantID = ''
    }
	  var customerID = this.props.customer.value;
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': productID,
        'variant-id': variantID
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
      this.findNewPrice(parseInt(this.props.quantity));
    })
  }

  handleQuantityChange = (event) => {
    event.preventDefault();
    var quantity = event.target.value;
     this.props.update_item_handler(this.props.id, 'Quantity', quantity)
     var quantityInt = parseInt(quantity)
     this.findNewPrice(quantityInt);

  }

  findNewPrice = (quantity) => {
    if(!quantity || !Number.isInteger(quantity))
    {
      return;
    }
    var minPrice = this.state.priceList.length > 0 && this.state.priceList.reduce(
      (min, item) =>
         quantity >= parseInt(item.lower_range)
         && quantity <= parseInt(item.upper_range)
         &&  parseFloat(item.price) < parseFloat(min.price)
         ? item : min);
    if(quantity >= parseInt(minPrice.lower_range) && quantity <= parseInt(minPrice.upper_range))
    {
      this.handlePriceChange({target:{value:minPrice.price}})
    }

  }

  handlePriceChange = (event) => {
    var price = event.target.value.replace('$', '').trim()
    this.props.update_item_handler(this.props.id, 'Pricing', price)
  }


  findMatchingElementByID(value, list) {
      var result = list.find(element => element.value===value);
      return result;

  }


  removeItem = (event) => {
	   event.preventDefault();
	    this.props.delete_item_handler(this.props.id)
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
          <Select value={this.props.product} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
          </div>
        <div data-field-span="1">
          <label>Variant</label>
          <Select value={this.findMatchingElementByID(this.props.variant_id, this.state.variants)} onChange={this.handleVariantChange} options={this.state.variants} isSearchable="true" placeholder="Select a Variant"/>
        </div>

			<div data-field-span="1">
				<label>Quantity</label>
				<input type="text" value={this.props.quantity} style={{'height': this.state.inputHeight}} onChange={this.handleQuantityChange} />
			</div>
			<div data-field-span="1">
				<label>Pricing</label>
				<input type="text" value={this.props.price} style={{'height': this.state.inputHeight}} onChange={this.handlePriceChange} />
			</div>

			<div data-field-span="1">
				<label>Subtotal</label>
				{(this.props.quantity * this.props.price).toFixed(2)}
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
