import React, { Component } from 'react';
import OrderItem from './OrderItem';
import '../public/css/gridforms.css';
import * as jsPDF from 'jspdf';
import * as Base64 from 'base-64';
import logo from '../public/images/LTLogo.png';




class OrderList extends Component {
	constructor(props) {
    super(props);
	this.state = {
		counter: /*localStorage.getItem('counter') ? localStorage.getItem('counter') :*/ '5',
		order_items: /*localStorage.getItem('order_items') ? JSON.parse(localStorage.getItem('order_items')) :*/ []

	};

    this.removeItem = this.removeItem.bind(this);
    this.orderItemUpdated = this.orderItemUpdated.bind(this);
    this.addItem = this.addItem.bind(this);
    this.generatePDF = this.generatePDF.bind(this);
    this.saveOrderAndGeneratePDF = this.saveOrderAndGeneratePDF.bind(this);


	}

    async componentDidMount() {
	  if (this.state.order_items === undefined || this.state.order_items.length == 0)
	  {
		this.addOrderLine()
	  }
    }




	buildInvoiceBody() {
		var lines =[]
		var items = this.state.order_items;
		for(var i = 0; i < items.length; i++) {
			var item = items[i];
			var variant_id = 0;
			if(item.variant_id === -1) {
				variant_id = 'NULL';
			}

			lines.push({"ProductID":item.product_id, "VariationID": item.variant_id, "Quantity": item.quantity, "Price":item.price});
		}
		return lines;
	}

   removeItem(key) {
	  var items = this.state.order_items;
	  for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			items.splice(i, 1);
		}
	  }
	  this.saveState({order_items: items});
   }

   addItem(event) {
	event.preventDefault();
	this.addOrderLine();

   }

  addOrderLine() {
	  var key = Number(this.state.counter) + 1;
 	  var default_item = {key:'0', product_name:'Select a Product', product_id:"-1", variant:'No Variant', variant_id:'0', quantity:'0', price:'0'};
	  var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
	  cloneOfDefault.key = key;
	  var items = this.state.order_items;
	  items.push(cloneOfDefault);
	  this.saveState({counter: key, order_items: items });
  }


   saveState(state) {
	this.setState(state)
   }

   calculateTotal(subtotals) {
	  var items = this.state.order_items;
	  var total = 0;
	  for(var i = 0; i < items.length; i++) {
		total += items[i].quantity * items[i].price;
	  }
	  return total;
   }

   orderItemUpdated(key, item) {
	   var items = this.state.order_items;
	   for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			if(item == null){
				items.splice(i, 1);
			}else {
				items[i] = {...items[i], ...item}
			}
		}
	  }
	  this.saveState({order_items: items});
   }

   generatePDF() {
	var doc = new jsPDF();
	var initX = 15;
	var initY = 50;
	var imgData = 'data:image/png;base64,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';

	doc.setFillColor(6,46,112);
	doc.rect(5, 5, 200, 20, 'F');
	doc.addImage(imgData , 'png', 7, 7, 100, 10);

	doc.text('Logtag Order #0569023', 15, 35);
	var items = this.state.order_items;
	doc.text('Product', initX, initY);
	doc.text('Variation', initX+44, initY);
	doc.text('Price', initX+90, initY);
	doc.text('Quantity', initX+120, initY);
	doc.text('Subtotal', initX+144, initY);
	doc.line(initX, initY+5, initX+180, initY+5);
	initY += 20;
	for(var i = 0; i < items.length; i++) {
		doc.text(doc.splitTextToSize(items[i].product_name, 40), initX, initY);
		doc.text(doc.splitTextToSize(items[i].variant.replace(',',', \n'), 36), initX+44, initY);
		doc.text(items[i].price, initX+90, initY);
		doc.text(items[i].quantity, initX+120, initY);
		doc.text(items[i].quantity*items[i].price+'', initX+144, initY);
		doc.line(initX, initY+15, initX+180, initY+15);
		initY += 25;

	}
	doc.text('Total: '+this.calculateTotal(), initX, initY);
	doc.save('Order.pdf')

   }

   saveOrderAndGeneratePDF(event) {
	   event.preventDefault();
		 if (window.confirm('Are you sure?')) {
	     this.generatePDF();
	     this.props.create_invoice_handler(this.buildInvoiceBody());
	   }
   }


   render() {
    return (
	<div className = "OrderList">

      <fieldset>
		{this.state.order_items.map(item => (
			<OrderItem key={item.key} item={item} products={this.props.products} update_item_handler={this.orderItemUpdated} customer={this.props.customer}/>
		))}


	  </fieldset>

	  <button onClick={this.addItem}>Add Product</button>

	  <div>
		<strong>Total: {this.calculateTotal()}</strong>
	  </div>

	  <div>
		<button onClick={this.saveOrderAndGeneratePDF}>Generate PDF</button>
	  </div>
	</div>

    );
  }
}

export default OrderList;
