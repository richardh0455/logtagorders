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
    priceList: []
	};

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }

  async componentDidUpdate() {
    if(this.props.variant_id && this.props.variant_id!='0' && this.state.variants.length == 0)
    {
      this.getVariants();
      this.getPriceList();
    }
  }

  handleProductChange = (event) => {
    this.props.update_item_handler(this.props.id, 'ProductID', event.value)
    if(this.props.product && this.props.customer)
    {
      this.getVariants();
      this.getPriceList();
    }
  }


  handleVariantChange = (event) => {
	  this.props.update_item_handler(this.props.id, 'VariationID', event.value)
  }

  async getVariants() {
	  var productID = this.props.product.value;
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
    var productID = this.props.product.value;
	  var customerID = this.props.customer.value;
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': productID
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
    event.preventDefault();
    console.log('Quantity Changed')
    console.log(event.target.value);
    var quantity = event.target.value;
     this.props.update_item_handler(this.props.id, 'Quantity', quantity)
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
    this.props.update_item_handler(this.props.id, 'Pricing', price)
  }


  findMatchingElementByID(value, list) {
      var result = list.find(element => element.value===value);
      return result;

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
      <div className onKeyPress={this.onKeyPress}>
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
				<input type="text" value={this.props.quantity} onChange={this.handleQuantityChange} />
			</div>
			<div data-field-span="1">
				<label>Pricing</label>
				<input type="text" value={this.props.price} onChange={this.handlePriceChange} />
			</div>

			<div data-field-span="1">
				<label>Subtotal</label>
				{this.props.quantity * this.props.price}
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
