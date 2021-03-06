import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';
import Accordian  from '../Accordian';
import PriceItem  from './PriceItem';


const customerAPI = 'CustomersAPI';
const variantsAPI = 'VariantsAPI';
const getAllPath = '/all';

class ViewCustomers extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedProductID:"",
        currentlySelectedCustomerID:"",
        currentlySelectedVariationID:"",
        priceList:[],
        counter:0,
        variations: []
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  handleCustomerChange = (event) => {
    this.setState({currentlySelectedCustomerID: event.value})
    if(this.state.currentlySelectedProductID && this.state.currentlySelectedProductID !== '')
    {
      this.getVariations(event.value, this.state.currentlySelectedProductID)
      this.getCustomerPriceLists(event.value, this.state.currentlySelectedProductID, null)
    }
  }

  handleProductChange = (event) => {
    this.setState({currentlySelectedProductID: event.value})
    if(this.state.currentlySelectedCustomerID && this.state.currentlySelectedCustomerID !== '')
    {
      this.getVariations(this.state.currentlySelectedCustomerID, event.value)
      this.getCustomerPriceLists(this.state.currentlySelectedCustomerID,  event.value, null)
    }
  }

  handleVariationChange = (event) => {
    this.setState({currentlySelectedVariationID: event.value})
    this.getCustomerPriceLists(this.state.currentlySelectedCustomerID, this.state.currentlySelectedProductID, event.value)
  }

  async getVariations(customerID, productID) {
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
        variants.push({"value":'None', "label":'None'})
		    this.setState({variations: variants});
	  }).catch(error => {
		    console.log(error)
	});
  }

  priceItemUpdated = (key, item) => {
    var items = this.state.priceList;
    for(var i = 0; i < items.length; i++) {
      if(items[i].key === key) {
        if(item == null){
          items.splice(i, 1);
        }else {
          items[i] = {...items[i], ...item}
        }
      }
   }
   this.setState({priceList: items});
   //this.updatePriceItem(item);
  }

  getCustomerPriceLists = (customerID, productID, variationID) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': productID
      }
    };
    if(variationID && variationID !== '' && variationID !== 'None')
    {
      apiRequest.queryStringParameters['variation-id']=variationID
    }
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

  deletePriceItem = (id) => {
      const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        queryStringParameters: {
          'ID': id
        }
      };
      API.del(customerAPI, '/'+this.state.currentlySelectedCustomerID+'/price-list', apiRequest)
      .then(response => {
        if(response.body["AffectedRows"] === 1)
        {
          var sleep = 3000;
          NotificationManager.success('', 'Price Item Successfully Deleted', sleep);
          this.getCustomerPriceLists(this.state.currentlySelectedCustomerID, this.state.currentlySelectedProductID);
        }
        else {
          NotificationManager.error('Failed to Deleted Price Item', 'Error', 5000, () => {});
        }
      })
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updatePriceItem = (priceItem) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': this.state.currentlySelectedProductID,
        'ID': priceItem.ID
      },
      body: {
        'Price': priceItem.price,
        'Lower_Range': priceItem.lower_range,
        'Upper_Range': priceItem.upper_range
      }
    };
    API.put(customerAPI, '/'+this.state.currentlySelectedCustomerID+'/price-list', apiRequest)
    .then(response => {
    })
  }

  createPriceItem = (priceItem) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': this.state.currentlySelectedProductID
      },
      body: {
        'Price': priceItem.price,
        'Lower_Range': priceItem.lower_range,
        'Upper_Range': priceItem.upper_range
      }
    };
    if(this.state.currentlySelectedVariationID && this.state.currentlySelectedVariationID !== '' && this.state.currentlySelectedVariationID !== 'None')
    {
      apiRequest.queryStringParameters['variation-id']=this.state.currentlySelectedVariationID
    }
    //this.setState({currentlySelectedCustomerID:id})
    API.post(customerAPI, '/'+this.state.currentlySelectedCustomerID+'/price-list', apiRequest)
    .then(response => {
      priceItem.ID = response.body.ID
      //this.getCustomerPriceLists(this.state.currentlySelectedCustomerID, this.state.currentlySelectedProductID);
      var array = this.state.priceList;
      array.push({'lower_range':priceItem.Lower_Range, 'upper_range':priceItem.Upper_Range, 'price':priceItem.Price, 'ID':priceItem.ID})
      //console.log();
      this.setState({priceList: array})
    })
  }

  addPriceItem = (event) => {
		event.preventDefault();
		this.addItemToList();
  }

  addItemToList() {
 	  var default_item = {lower_range:'0', upper_range:'0', price:'0'};
	  this.createPriceItem(default_item);

  }

  savePriceItems = (event) => {
    event.preventDefault();
    this.state.priceList.map(item => {
        this.updatePriceItem(item);
    });
    //this.getCustomerPriceLists(this.state.currentlySelectedCustomerID, this.state.currentlySelectedProductID);
    NotificationManager.success('', 'Price List Successfully Updated', 3000);

  }

  render() {
    return (
      <div>
      <section>
        <form className="grid-form">
          <fieldset>
            <div data-row-span="3">
              <div data-field-span="1">
                <label>Customer</label>
                <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
              </div>
              <div data-field-span="1">
                <label>Product</label>
                <Select value={this.state.currentlySelectedProduct} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
              </div>
              <div data-field-span="1">
                <label>Variant</label>
                <Select value={this.state.currentlySelectedVariation} onChange={this.handleVariationChange} options={this.state.variations} isSearchable="true" placeholder="Select a Variant"/>
              </div>
            </div>
          </fieldset>
          <fieldset>
    		    {this.state.priceList.map(item => (
    			       <PriceItem key = {item.ID} item = {item} update_item_handler={this.priceItemUpdated} delete_price_item={this.deletePriceItem}/>

    		         ))}
    	     </fieldset>
            <button onClick={this.addPriceItem}>Add Price Bracket</button>

            <button onClick={this.savePriceItems}>Save</button>
        </form>
      </section>
        <section>

        </section>
      </div>
    );
  }
}
export default withRouter(ViewCustomers);
