import React from 'react';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { Auth, API } from 'aws-amplify';
import Select from 'react-select';

const createPath = '/create';
const variantsAPI = 'VariantsAPI';

class CreateVariant extends React.Component{

  constructor(props) {
    super(props);

    this.state = {
      currentlySelectedCustomer: null,
	  currentlySelectedProduct: null,
      description: '',
      price: '0'
    };
	this.handleCustomerChange = this.handleCustomerChange.bind(this);
	this.handleProductChange = this.handleProductChange.bind(this);
	this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
	this.handlePriceChange = this.handlePriceChange.bind(this);

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }

  async handleCustomerChange(event) {

    this.setState({currentlySelectedCustomer: event})

  }
  async handleProductChange(event) {

    this.setState({currentlySelectedProduct: event})

  }

  async handleDescriptionChange(event) {

    this.setState({description: event.target.value})

  }
  async handlePriceChange(event) {

    this.setState({price: event.target.value})

  }

  async createVariantHandler(e) {
	e.preventDefault();
	this.createVariant({customerID:this.state.currentlySelectedCustomer.value, productID:this.state.currentlySelectedProduct.value, description:this.state.description, price:this.state.price  });

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



  render() {
    return (
      <div >
      <section>
        <form className="grid-form">
          <fieldset>
			<div data-row-span="3">
            <div data-field-span="1">
				<label>Customer Name</label>
				<Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
			</div>
			<div data-field-span="1">
				<label>Product Name</label>
				<Select value={this.state.currentlySelectedProduct} onChange={this.handleProductChange} options={this.props.products} isSearchable="true" placeholder="Select a Product"/>
			</div>
			<div data-field-span="1">
				<label>Description</label>
				<input type="text" value={this.state.description} onChange={this.handleDescriptionChange} />
			</div>
			</div>
			<div data-row-span="1">
			<div data-field-span="1">
				<label>Price</label>
				<input type="text" value={this.state.price}  onChange={this.handlePriceChange} />
			</div>
			</div>

        </fieldset>
		<div >
			<button onClick={(e) => {this.createVariantHandler(e)} }>Create Variant</button>
		</div>
        </form>
      </section>


      </div>
    );
  }
}

export default withRouter(CreateVariant);
