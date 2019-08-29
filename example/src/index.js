import React from "react";
import ReactDom from "react-dom";
import AvatarCropper from "../../lib";

class App extends React.Component {
  
  constructor (props) {
    super(props);

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleCrop = this.handleCrop.bind(this);
    this.handleRequestHide = this.handleRequestHide.bind(this);

    this.state = {
      cropperOpen: false,
      img: null,
      croppedImg: "http://www.fillmurray.com/400/400"
    }
  }
  
  handleFileChange (dataURI) {
    this.setState({
      img: dataURI,
      croppedImg: this.state.croppedImg,
      cropperOpen: true
    });
  }

  handleCrop (dataURI) {
    this.setState({
      cropperOpen: false,
      img: null,
      croppedImg: dataURI
    });
  }

  handleRequestHide () {
    this.setState({
      cropperOpen: false
    });
  }

  render () {
    return (
      <div>
        <div className="avatar-photo">
          <FileUpload handleFileChange={this.handleFileChange} />
          <div className="avatar-edit">
            <span>Click to Pick Avatar</span>
            <i className="fa fa-camera"></i>
          </div>
          <img src={this.state.croppedImg} />
        </div>
        {this.state.cropperOpen &&
          <AvatarCropper
            onRequestHide={this.handleRequestHide}
            cropperOpen={this.state.cropperOpen}
            onCrop={this.handleCrop}
            image={this.state.img}
            width={400}
            height={400}
          />
        }
      </div>
    );
  }
}

class FileUpload extends React.Component {

  constructor (props) {
    super(props);
    this.in = React.createRef();
    this.handleFile = this.handleFile.bind(this);
  }

  handleFile(e) {
    var reader = new FileReader();
    var file = e.target.files[0];

    if (!file) return;

    reader.onload = function(img) {
      if(this.in && this.in.current) {
        this.in.current.value = '';
      }
      this.props.handleFileChange(img.target.result);
    }.bind(this);
    reader.readAsDataURL(file);
  }

  render() {
    return (
      <input ref={this.in} type="file" accept="image/*" onChange={this.handleFile} />
    );
  }
};

ReactDom.render(<App />, document.getElementById("content"));
