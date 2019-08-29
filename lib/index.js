import "./styles.css";
import React from "react";
import PropTypes from "prop-types";
import { Modal, Button } from "react-bootstrap";
import {isDataURL} from "./utils";
import warning from "warning";

var numberableType = (props, propName, componentName) => {
  warning(
    !isNaN(parseInt(props[propName])),
    `Invalid ${propName} '${props.size}' sent to '${componentName}'. Requires an
    int or string capable of conversion to an int.
    Check the render method of == '${componentName}'. == `
  );
};

class Cropper extends React.Component {

  constructor () {
    super();
    this.canvas = React.createRef();
    this.zoom = React.createRef();

    this.state = {
      dragging: false,
      image: {},
      mouse: {
        x: null,
        y: null
      },
      preview: null,
      zoom: 1
    };

    this.listeners = [];

  }

  fitImageToCanvas (width, height) {
    var scaledHeight, scaledWidth;

    var canvasAspectRatio = this.props.height / this.props.width;
    var imageAspectRatio = height / width;

    if (canvasAspectRatio > imageAspectRatio) {
      scaledHeight = this.props.height;
      let scaleRatio = scaledHeight / height;
      scaledWidth = width * scaleRatio;
    } else {
      scaledWidth = this.props.width;
      let scaleRatio = scaledWidth / width;
      scaledHeight = height * scaleRatio;
    }

    return { width: scaledWidth, height: scaledHeight };
  }

  prepareImage (imageUri) {
    var img = new Image();
    if (!isDataURL(imageUri)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      var scaledImage = this.fitImageToCanvas(img.width, img.height);
      scaledImage.resource = img;
      scaledImage.x = 0;
      scaledImage.y = 0;
      this.setState({dragging: false, image: scaledImage, preview: this.toDataURL()});
    };
    img.src = imageUri;
  }

  mouseDownListener (e) {
    this.setState({
      image: this.state.image,
      dragging: true,
      mouse: {
        x: null,
        y: null
      }
    });
  }

  preventSelection (e) {
    if (this.state.dragging) {
      e.preventDefault();
      return false;
    }
  }

  mouseUpListener (e) {
    this.setState({ dragging: false, preview: this.toDataURL() });
  }

  mouseMoveListener (e) {
    if (!this.state.dragging) return;

    var mouseX = e.clientX;
    var mouseY = e.clientY;
    var imageX = this.state.image.x;
    var imageY = this.state.image.y;

    var newImage = this.state.image;

    if (this.state.mouse.x && this.state.mouse.y) {
      var dx = this.state.mouse.x - mouseX;
      var dy = this.state.mouse.y - mouseY;

      var bounded = this.boundedCoords(imageX, imageY, dx, dy);

      newImage.x = bounded.x;
      newImage.y = bounded.y;
    }

    this.setState({
      image: this.state.image,
      mouse: {
        x: mouseX,
        y: mouseY
      }
    });
  }

  boundedCoords (x, y, dx, dy) {
    var newX = x - dx;
    var newY = y - dy;

    var scaledWidth = this.state.image.width * this.state.zoom;
    var dw = (scaledWidth - this.state.image.width) / 2;
    var imageLeftEdge = this.state.image.x - dw;
    var imageRightEdge = (imageLeftEdge + scaledWidth);

    var rightEdge = this.props.width;
    var leftEdge = 0;

    if (newX - dw > 0) { x = dw; }
    else if (newX < (-scaledWidth + rightEdge)) { x = rightEdge - scaledWidth; }
    else {
      x = newX;
    }

    var scaledHeight = this.state.image.height * this.state.zoom;
    var dh = (scaledHeight - this.state.image.height) / 2;
    var imageTopEdge = this.state.image.y - dh;
    var imageBottomEdge = imageTopEdge + scaledHeight;

    var bottomEdge = this.props.height;
    var topEdge = 0;
    if (newY - dh > 0) { y = dh; }
    else if (newY < (-scaledHeight + bottomEdge)) { y = bottomEdge - scaledHeight; }
    else {
      y = newY;
    }

    return { x: x, y: y };
  }

  componentDidMount () {    
    this.prepareImage(this.props.image);

    this.listeners = {
      mousemove: e => this.mouseMoveListener(e),
      mouseup: e => this.mouseUpListener(e),
      mousedown: e => this.mouseDownListener(e)
    };

    window.addEventListener("mousemove", this.listeners.mousemove, false);
    window.addEventListener("mouseup", this.listeners.mouseup, false);
    if(this.canvas && this.canvas.current) {
      this.canvas.current.addEventListener("mousedown", this.listeners.mousedown, false);
    }
    document.onselectstart = e => this.preventSelection(e);
  }

  // make sure we clean up listeners when unmounted.
  componentWillUnmount () {
    window.removeEventListener("mousemove", this.listeners.mousemove);
    window.removeEventListener("mouseup", this.listeners.mouseup);
    if(this.canvas && this.canvas.current) {
      this.canvas.current.removeEventListener("mousedown", this.listeners.mousedown);
    }
  }

  componentDidUpdate () {
    if(this.canvas && this.canvas.current) {
      const context = this.canvas.current.getContext("2d");
      context.clearRect(0, 0, this.props.width, this.props.height);
      this.addImageToCanvas(context, this.state.image);
    }
    
  }

  addImageToCanvas (context, image) {
    if (!image.resource) return;
    context.save();
    context.globalCompositeOperation = "destination-over";
    var scaledWidth = this.state.image.width * this.state.zoom;
    var scaledHeight = this.state.image.height * this.state.zoom;

    var x = image.x - (scaledWidth - this.state.image.width) / 2;
    var y = image.y - (scaledHeight - this.state.image.height) / 2;

    // need to make sure we aren't going out of bounds here...
    x = Math.min(x, 0);
    y = Math.min(y, 0);
    y = scaledHeight + y >= this.props.height ? y : (y + (this.props.height - (scaledHeight + y)));
    x = scaledWidth + x >= this.props.width ? x : (x + (this.props.width - (scaledWidth + x)));

    context.drawImage( image.resource, x, y, image.width * this.state.zoom, image.height * this.state.zoom);
    context.restore();
  }

  toDataURL () {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = this.props.width;
    canvas.height = this.props.height;

    this.addImageToCanvas(context, {
      resource: this.state.image.resource,
      x: this.state.image.x,
      y: this.state.image.y,
      height: this.state.image.height,
      width: this.state.image.width
    });

    return canvas.toDataURL();
  }

  handleCrop () {
    const data = this.toDataURL();
    this.props.onCrop(data);
  }

  handleZoomUpdate () {
    const newstate = this.state;
    if(this.zoom && this.zoom.current) {
      newstate.zoom = this.zoom.current.value;
    }
    this.setState({newstate});
  }

  render () {
    return (
      <div className="AvatarCropper-canvas">
        <div className="row">
          <canvas
            ref={this.canvas}
            width={this.props.width}
            height={this.props.height}>
          </canvas>
        </div>

        <div className="row">
          <input
            type="range"
            name="zoom"
            ref={this.zoom}
            onChange={this.handleZoomUpdate.bind(this)}
            style={{width: this.props.width}}
            min="1"
            max="3"
            step="0.01"
            defaultValue="1"
          />
        </div>

        <div className='modal-footer'>
          <Button onClick={this.props.onRequestHide}>{this.props.closeButtonCopy}</Button>
          <Button bsStyle='primary' onClick={this.handleCrop.bind(this)}>
            {this.props.cropButtonCopy}
          </Button>
        </div>

      </div>
    );
  }
}
Cropper.propTypes = {
    image: PropTypes.string.isRequired,
    width: numberableType,
    height: numberableType,
    zoom: numberableType
};
Cropper.defaultProps = { width: 400, height: 400, zoom: 1 };

class AvatarCropper extends React.Component {
  constructor () {
    super();
  }

  handleZoomUpdate () {
    if(this.zoom && this.zoom.current) {
      const zoom = this.zoom.current.value;
      this.setState({ zoom: zoom });
    }
    
  }

  render () {
    return (
      <Modal
        title="Crop It"
        bsSize={this.props.modalSize}
        onHide={this.props.onRequestHide}
        show={this.props.cropperOpen}
        backdrop={false}>
        <div className="modal-body">

          <div className="AvatarCropper-base">
            <Cropper
              image={this.props.image}
              width={this.props.width}
              height={this.props.height}
              onCrop={this.props.onCrop}
              onRequestHide={this.props.onRequestHide}
              closeButtonCopy={this.props.closeButtonCopy}
              cropButtonCopy={this.props.cropButtonCopy}
            />
          </div>

        </div>
      </Modal>
    );
  }
}

// The AvatarCropper Prop API
AvatarCropper.propTypes = {
  image: PropTypes.string.isRequired,
  onCrop: PropTypes.func.isRequired,
  closeButtonCopy: PropTypes.string,
  cropButtonCopy: PropTypes.string,
  width: numberableType,
  height: numberableType,
  modalSize: PropTypes.oneOf(["lg", "large", "sm", "small"]),
  onRequestHide: PropTypes.func.isRequired
};
AvatarCropper.defaultProps = { width: 400, height: 400, modalSize: "large",
                               closeButtonCopy: "Close", cropButtonCopy: "Crop and Save"};

export default AvatarCropper;
