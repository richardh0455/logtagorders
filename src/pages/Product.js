import React from 'react';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { Auth, API } from 'aws-amplify';
import Select from 'react-select';

const productsAPI = 'ProductsAPI';

class Product extends React.Component{

  constructor(props) {
    super(props);

    this.state = {
      name: '',
      description: '',
      cost_price: '0',
      isUpdate: false
    };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  handleNameChange = (event) => {
    this.setState({name: event.target.value})
  }

  handleDescriptionChange = (event) => {
    this.setState({description: event.target.value})
  }

  handlePriceChange = (event) => {
    this.setState({cost_price: event.target.value})
  }

  handleProductChange = (event) => {
	   this.setState({
       currentlySelectedProduct: event,
       name: event.product.Name,
       description:event.product.Description,
       cost_price:event.product.Cost_Price
     })

  }

  async createProductHandler(e) {
	  e.preventDefault();
	  this.createProduct({name:this.state.name, description:this.state.description, cost_price:this.state.cost_price  });

  }

  async updateProductEventHandler(e) {
	  e.preventDefault();
	  this.updateProduct({ID: this.state.currentlySelectedProduct.value, name:this.state.name, description:this.state.description, cost_price:this.state.cost_price  });

  }

  async createProduct(product) {
    var cost_price = product.cost_price.replace('$', '').trim()
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: {"Name": product.name, "Description": product.description, "CostPrice":cost_price}
      };
      API.post(productsAPI, '', apiRequest)
	  .then(response => {
      if(response.statusCode === "200"){
        NotificationManager.success('', 'Product Successfully Created', 3000);
        this.setState({
          name:'',
          description:'',
          cost_price:'0'
        })
        this.props.get_all_products();
      } else {
        NotificationManager.error('Product creation Failed', 'Error', 5000, () => {});
      }

      console.log(response);
	  })
	  .catch(err => {
		    NotificationManager.error('Product creation Failed', 'Error', 5000, () => {});
	  })
  }

  async updateProduct(product) {
    var cost_price = product.cost_price.replace('$', '').trim()
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: {"Name": product.name, "Description": product.description, "CostPrice":cost_price}
      };
      API.put(productsAPI, "/"+product.ID, apiRequest)
	  .then(response => {
      if(response.statusCode === "200"){
        NotificationManager.success('', 'Product Successfully Updated', 3000);
        this.setState({
          name:'',
          description:'',
          cost_price:'0'
        })
        this.props.get_all_products();
      } else {
        NotificationManager.error('Product Updating Failed', 'Error', 5000, () => {});
      }

      console.log(response);
	  })
	  .catch(err => {
		    NotificationManager.error('Product Updating Failed', 'Error', 5000, () => {});
	  })
  }


  createOrUpdate() {
    if(this.state.isUpdate){
      return (
        <div data-field-span="1" >
          <label>Product</label>
          <Select value={this.state.currentlySelectedProduct} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
      </div>);
    }
  }
  createProductChangeHandler = (event) => {
    this.setState({
      isUpdate:false
    });
  }

  updateProductChangeHandler = (event) => {
    this.setState({
      isUpdate:true

    });
  }


  getButtonText() {
    if(this.state.isUpdate){
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.updateProductEventHandler(e)} }>Update Product</button>);
    }
    else {
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.createProductHandler(e)} }>Create Product</button>);

    }

  }

  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
              <div data-row-span="2">
                <div className="radio">
                  <label>
                    <input type="radio" checked={!this.state.isUpdate} onChange={this.createProductChangeHandler} />
                    Create Product
                  </label>

                  <label style={{marginLeft: 20 + 'px'}}>
                    <input type="radio" checked={this.state.isUpdate} onChange={this.updateProductChangeHandler} />
                    Update Product
                  </label>
                </div>
                {this.createOrUpdate()}
              </div>
			        <div data-row-span="2">
                <div data-field-span="1">
				          <label>Product Name</label>
				          <input type="text" value={this.state.name} onChange={this.handleNameChange} />
			          </div>
			          <div data-field-span="1">
				          <label>Description</label>
				          <input type="text" value={this.state.description} onChange={this.handleDescriptionChange} />
			          </div>
			        </div>
			        <div data-row-span="1">
			          <div data-field-span="1">
				          <label>Cost Price</label>
				          <input type="text" value={this.state.cost_price}  onChange={this.handlePriceChange} />
			          </div>
			        </div>
            </fieldset>
		        <div>
              {this.getButtonText()}
		        </div>
          </form>
        </section>
      </div>
    );
  }
}

export default withRouter(Product);
