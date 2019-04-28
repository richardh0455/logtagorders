import React from 'react';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { Auth, API } from 'aws-amplify';
import Select from 'react-select';

const createPath = '/create';
const getAllPath = '/all';
const updatePath = '/update';
const variantsAPI = 'VariantsAPI';

class Variant extends React.Component{

  constructor(props) {
    super(props);

    this.state = {
      currentlySelectedCustomer: null,
	    currentlySelectedProduct: null,
      currentlySelectedVariant: null,
      description: '',
      price: '0',
      variants:[],
      isUpdate: false
    };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }

  handleCustomerChange = (event) => {
    this.setState({currentlySelectedCustomer: event}, () =>
    {
      if(this.state.currentlySelectedProduct && this.state.currentlySelectedCustomer)
      {
        this.getVariants();
      }
    })
  }

  handleProductChange = (event) => {

    this.setState({currentlySelectedProduct: event}, () =>
    {
      if(this.state.currentlySelectedProduct && this.state.currentlySelectedCustomer)
      {
        this.getVariants();
      }
    })

  }

  handleVariantChange = (event) => {
    console.log(event);
	   this.setState({
       currentlySelectedVariant: event,
       description:event.label,
       price:event.price
     })

  }

  async getVariants() {
	  var productID = this.state.currentlySelectedProduct.value;
	  var customerID = this.state.currentlySelectedCustomer.value;
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

  handleDescriptionChange = (event) => {
    this.setState({description: event.target.value})
  }

  handlePriceChange = (event) => {
    this.setState({price: event.target.value})
  }

  createVariantHandler = (e) => {
	  e.preventDefault();
	  this.createVariant({customerID:this.state.currentlySelectedCustomer.value, productID:this.state.currentlySelectedProduct.value, description:this.state.description, price:this.state.price  });
  }

  updateVariantHandler = (e) => {
	  e.preventDefault();
	  this.updateVariant({ID: this.state.currentlySelectedVariant.value, customerID:this.state.currentlySelectedCustomer.value, productID:this.state.currentlySelectedProduct.value, description:this.state.description, price:this.state.price  });
  }

  async createVariant(variant) {
    var price = variant.price.replace('$', '').trim()
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: {"CustomerID": variant.customerID,"ProductID": variant.productID, "Description": variant.description, "Price":price}
      };
      API.post(variantsAPI, createPath, apiRequest)
	  .then(response => {
        if(response.statusCode === "200") {
          NotificationManager.success('', 'Variant Successfully Created',3000);
      		this.setState({
      			name:'',
      			description:'',
      			price:'0'
      		})

        } else {
          NotificationManager.error('Variant creation Failed', 'Error', 5000, () => {});
        }

	  })
	  .catch(err => {
		NotificationManager.error('Variant creation Failed', 'Error', 5000, () => {});
	  })

  }

  async updateVariant(variant) {
    var price = variant.price.replace('$', '').trim()
    if(!variant.customerID || !variant.productID || !variant.ID)
    {
      NotificationManager.error('Please Select a Customer, Product, and Variant to Update.', 'Error', 5000, () => {});
    }
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: {"CustomerID": variant.customerID,"ProductID": variant.productID, "Description": variant.description, "Price":price}
      };
      API.post(variantsAPI, "/"+variant.ID+updatePath, apiRequest)
	  .then(response => {
        if(response.statusCode === "200") {
          NotificationManager.success('', 'Variant Successfully Updated',3000);
      		this.setState({
      			name:'',
      			description:'',
      			price:'0'
      		})

        } else {
          NotificationManager.error('Variant updating Failed', 'Error', 5000, () => {});
        }

	  })
	  .catch(err => {
		  NotificationManager.error('Variant updating Failed', 'Error', 5000, () => {});
	  })

  }

  required(field) {
    if(field  === null) {
     return <span style={{'fontSize': '12px', 'color':'#ba090c'}}>Please Select a Value</span>
    }
  }

  renderProductSelect = () => {
    return (
      <div data-field-span="1">
        <label>Product Name</label>
        <Select value={this.state.currentlySelectedProduct} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
        {this.required(this.state.currentlySelectedProduct)}
      </div>
    );
  }

  renderCustomerSelect = () => {
    return (
      <div data-field-span="1">
        <label>Customer Name</label>
        <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
        {this.required(this.state.currentlySelectedCustomer)}
      </div>
    );
  }


  createOrUpdate() {
    if(this.state.isUpdate){
      return (
        <div data-row-span="3">
          {this.renderCustomerSelect()}
          {this.renderProductSelect()}
          <div data-field-span="1" >
            <label>Variant</label>
            <Select value={this.state.currentlySelectedVariant} onChange={this.handleVariantChange} options={this.state.variants} isSearchable="true" placeholder="Select a Variant"/>
            {this.required(this.state.currentlySelectedVariant)}
          </div>
        </div>
        );
    } else {
      return (
        <div data-row-span="2">
          {this.renderCustomerSelect()}
          {this.renderProductSelect()}
      </div>
      );

    }
  }
  createVariantChangeHandler = (event) => {
    this.setState({
      isUpdate:false
    });
  }

  updateVariantChangeHandler = (event) => {
    this.setState({
      isUpdate:true
    });
  }

  getButtonText() {
    if(this.state.isUpdate){
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.updateVariantHandler(e)} }>Update Variant</button>);
    }
    else {
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.createVariantHandler(e)} }>Create Variant</button>);

    }
  }

  render() {
    return (
      <div >
      <section>
        <form className="grid-form">
          <fieldset>
          <div data-row-span="2">
            <div className="radio">
              <label>
                <input type="radio" checked={!this.state.isUpdate} onChange={this.createVariantChangeHandler} />
                Create Variant
              </label>

              <label style={{marginLeft: 20 + 'px'}}>
                <input type="radio" checked={this.state.isUpdate} onChange={this.updateVariantChangeHandler} />
                Update Variant
              </label>
            </div>
            {this.createOrUpdate()}
          </div>
			<div data-row-span="2">
        <div data-field-span="1">
				  <label>Description</label>
				  <input type="text" value={this.state.description} onChange={this.handleDescriptionChange} />
			  </div>
			  <div data-field-span="1">
				  <label>Price</label>
				  <input type="text" value={this.state.price}  onChange={this.handlePriceChange} />
			  </div>
			</div>

        </fieldset>
		<div >
			{this.getButtonText()}
		</div>
        </form>
      </section>


      </div>
    );
  }
}

export default withRouter(Variant);
