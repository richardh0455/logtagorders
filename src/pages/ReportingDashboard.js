import React from 'react';
import { withRouter } from 'react-router-dom';
import { Auth, API } from 'aws-amplify';
import moment from 'moment'
 var QuickSightEmbedding = require("amazon-quicksight-embedding-sdk");


import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';


const getAll = '/all';
const ordersAPI = 'OrdersAPI';

class ReportingDashboard extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
    if(this.props.url){
      this.embedDashboard(this.props.url)
    }
  }


  embedDashboard(url) {
    var containerDiv = document.getElementById("dashboardContainer");
    var params = {
      url: url,
      container: containerDiv,
      scrolling: "yes",
      height: "700px",
      parameters: {
        StartDate: moment(new Date()).subtract(1, 'month').format('YYYY-MM-DD hh:mm'),
        EndDate: moment(new Date()).format('YYYY-MM-DD hh:mm')
      }
    };
    var dashboard = QuickSightEmbedding.embedDashboard(params);
    dashboard.on('error', function() {});
    dashboard.on('load', function() {});
  }


  render() {
    return (
      <div id="dashboardContainer"></div>
    );
  }
}

export default withRouter(ReportingDashboard);
