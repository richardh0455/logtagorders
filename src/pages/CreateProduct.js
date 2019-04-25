import React from 'react';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { Auth, API } from 'aws-amplify';


const createPath = '/create';
const productsAPI = 'ProductsAPI';

class CreateProduct extends React.Component{

  constructor(props) {
    super(props);

    this.state = {
      name: '',
      description: '',
      cost_price: '0'
    };
	this.handleNameChange = this.handleNameChange.bind(this);
	this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
	this.handlePriceChange = this.handlePriceChange.bind(this);

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  async handleNameChange(event) {

    this.setState({name: event.target.value})

  }
  async handleDescriptionChange(event) {

    this.setState({description: event.target.value})

  }
  async handlePriceChange(event) {

    this.setState({cost_price: event.target.value})

  }

  async createProductHandler(e) {
	e.preventDefault();
	this.createProduct({name:this.state.name, description:this.state.description, cost_price:this.state.cost_price  });

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
      API.post(productsAPI, createPath, apiRequest)
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



  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
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
			        <button onClick={(e) => {this.createProductHandler(e)} }>Create Product</button>
		        </div>
          </form>
        </section>
      </div>
    );
  }
}

export default withRouter(CreateProduct);
