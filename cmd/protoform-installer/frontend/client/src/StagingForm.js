import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
// import deepPurple from '@material-ui/core/colors/purple';

//TODO: figure out child selectors/dynamic styles
const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  formContainer: {
    margin: "0 auto",
    width: "80%"
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 500
  },
  singleRowFields: {
    display: "flex"
  },
  singleRowFieldLeft: {
    marginRight: theme.spacing.unit / 2,
    flex: 1
  },
  singleRowFieldRight: {
    marginLeft: theme.spacing.unit / 2,
    flex: 1
  },
  singleRowThreeFieldLeft: {
    marginRight: theme.spacing.unit / 3,
    flex: 1
  },
  singleRowThreeFieldRight: {
    marginLeft: theme.spacing.unit / 3,
    flex: 1
  },
  singleRowThreeFieldMiddle: {
    marginRight: theme.spacing.unit / 3,
    flex: 1
  },
  menu: {
    width: 200
  },
  button: {
    margin: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  formControl: {
    margin: theme.spacing.unit * 3
  },
  group: {
    margin: `${theme.spacing.unit}px 0`,
    flexDirection: "row"
  },
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4
  }
});

const initialState = {
  namespace: "",
  flavor: "small",
  backupInterval: "24",
  backupUnit: "Hour(s)",
  showBackup: true,
  dockerRegistry: "docker.io",
  dockerRepo: "blackducksoftware",
  hubVersion: "4.8.1",
  dbPrototype: "empty",
  pvcStorageClass: "none",
  showManualStorageClass: false,
  status: "pending",
  token: "",
  emptyFormFields: true,
  backupSupport: "Yes",
  scanType: "Artifacts",
  pvcClaimSize: "20Gi",
  showNFSPath: true,
  nfsServer: "",
  certificateName: "default",
  showCertificates: false,
  hubType: "worker",
  environs: []
};

class StagingForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;

    // TODO: React docs - transform pkg, don't need to bind
    this.handleChange = this.handleChange.bind(this);
    this.handleCloneSupportChange = this.handleCloneSupportChange.bind(this);
    this.handleBackupSupportChange = this.handleBackupSupportChange.bind(this);
    this.handleScanTypeChange = this.handleScanTypeChange.bind(this);
    this.handleStorageClassChange = this.handleStorageClassChange.bind(this);
    this.handleCertificateChanges = this.handleCertificateChanges.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.validateNamespace = this.validateNamespace.bind(this);
    this.emptyFormFields = this.emptyFormFields.bind(this);
    this.handleEnvironAddClick = this.handleEnvironAddClick.bind(this);
  }

  componentDidMount() {
    this.namespaceField.addEventListener("blur", this.validateNamespace);
  }

  componentWillUnmount() {
    this.namespaceField.removeEventListener("blur", this.validateNamespace);
  }

  handleChange(event) {
    const stateKey = event.target.name;
    if (stateKey === undefined) {
      this.setState(() => {
        this.emptyFormFields();
      });
    } else {
      this.setState({ [stateKey]: event.target.value }, () => {
        this.emptyFormFields();
      });
    }
  }

  setPVCEmptyValue() {
    this.setState({
      pvcClaimSize: "",
      pvcStorageClass: "",
      scanType: "",
      showNFSPath: false,
      nfsServer: ""
    });
  }

  setPVCDefaultValue() {
    if (this.state.pvcStorageClass === "") {
      this.setState({
        pvcClaimSize: "20Gi",
        pvcStorageClass: "none",
        scanType: "Artifacts",
        showNFSPath: true,
        nfsServer: ""
      });
    }
  }

  handleCloneSupportChange(event) {
    if (event.target.value === "empty") {
      if (!this.state.showBackup) {
        this.setPVCEmptyValue();
      } else {
        this.setPVCDefaultValue();
      }
      this.setState({ showManualStorageClass: false });
    } else {
      this.setState({ showManualStorageClass: true });
      this.setPVCDefaultValue();
    }

    this.handleChange(event);
  }

  handleBackupSupportChange(event) {
    if (event.target.value === "Yes") {
      this.setState({
        showBackup: true,
        backupInterval: "24",
        backupUnit: "Hour(s)"
      });
      this.setPVCDefaultValue();
    } else {
      if (this.state.dbPrototype === "empty") {
        this.setPVCEmptyValue();
      }
      this.setState({ showBackup: false, backupInterval: "", backupUnit: "" });
    }
    this.handleChange(event);
  }

  handleStorageClassChange(event) {
    if (event.target.value === "none") {
      this.setState({ showNFSPath: true });
    } else {
      this.setState({ showNFSPath: false, nfsServer: "" });
    }
    this.handleChange(event);
  }

  handleScanTypeChange(event) {
    if (event.target.value === "Artifacts") {
      this.setState({ pvcClaimSize: "20Gi" });
    } else if (event.target.value === "Images") {
      this.setState({ pvcClaimSize: "1000Gi" });
    } else {
      this.setState({ pvcClaimSize: "10Gi" });
    }
    this.handleChange(event);
  }

  handleCertificateChanges(event) {
    if (event.target.value === "manual") {
      this.setState({ showCertificates: true });
    } else {
      this.setState({ showCertificates: false });
    }
    this.handleChange(event);
  }

  handleEnvironAddClick(event) {
    // this.setState(prevState => ({
    //   environs: [...prevState.environs, { key: "", value: "" }]
    // }));
    let environ = { key: "", value: "" };
    this.state.environs.push(environ);
    this.setState({ environs: this.state.environs })
    this.handleChange(event);
  }

  handleEnvironRemoveClick(i, event) {
    // let tmpEnvirons = [...this.state.environs];
    // tmpEnvirons.splice(i, 1);
    this.state.environs.splice(i, 1);
    this.setState({ environs: this.state.environs });
    if (this.state.key !== undefined) {
      delete this.state.key;
    }
    if (this.state.value !== undefined) {
      delete this.state.value;
    }
    this.handleChange(event);
  }

  handleEnvironKeyChange(i, event) {
    let environs = [...this.state.environs];
    environs[i] = { key: event.target.value, value: environs[i].value };
    this.setState({ environs });
    this.handleChange(event);
  }

  handleEnvironValueChange(i, event) {
    let environs = [...this.state.environs];
    environs[i] = { key: environs[i].key, value: event.target.value };
    this.setState({ environs });
    this.handleChange(event);
  }

  resetForm() {
    this.setState(initialState);
  }

  async handleSubmit(event) {
    event.preventDefault();
    const { token, emptyFormFields, ...formData } = this.state;
    const response = await fetch("/hub", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "rgb-token": token
      },
      mode: "same-origin",
      body: JSON.stringify({ ...formData })
    });

    if (response.status === 200) {
      this.props.setToastStatus({
        toastMsgOpen: true,
        toastMsgVariant: "success",
        toastMsgText:
          "Black Duck instance submitted! IP address will appear shortly"
      });
      this.props.addInstance(formData);
      this.resetForm();
      return;
    }

    this.props.setToastStatus({
      toastMsgOpen: true,
      toastMsgVariant: "error",
      toastMsgText:
        "Invalid token, check your token and try again ( error code " +
        response.status +
        "')'"
    });
  }

  validateNamespace(event) {
    const regExp = RegExp(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
    const invalidNamespace = !regExp.test(event.target.value);
    this.props.setNamespaceStatus(invalidNamespace);
  }

  emptyFormFields() {
    const {
      flavor,
      backupSupport,
      dbPrototype,
      backupUnit,
      backupInterval,
      pvcStorageClass,
      scanType,
      pvcClaimSize,
      status,
      showNFSPath,
      showBackup,
      showManualStorageClass,
      showCloneSupport,
      showCertificates,
      hubType,
      emptyFormFields: emptyFields,
      ...textFields
    } = this.state;

    const emptyFormFields = Object.keys(textFields).some(field => {
      if (
        field === "nfsServer" &&
        this.state.dbPrototype === "empty" &&
        this.state.backupSupport === "No"
      ) {
        return false;
      } else if (
        field === "certificate" &&
        this.state.certificateName !== "manual"
      ) {
        return false;
      } else if (field === "environs") {
        for (let environ of this.state.environs) {
          if (environ.key === "" || environ.value === "") {
            return true;
          }
        }
        return false;
      } else if (field === "") {
        return false;
      } else {
        return !Boolean(textFields[field]);
      }
    });

    // const texts = Object.keys(textFields);
    // texts.map(text => {
    //   console.log(text, textFields[text], !Boolean(textFields[text]), emptyFormFields);
    // });

    if (emptyFormFields !== this.state.emptyFormFields) {
      this.setState({ emptyFormFields });
    }
  }

  render() {
    const {
      classes,
      invalidNamespace,
      kubeSizes,
      backupSupports,
      manualStorageClasses,
      backupUnits,
      scanTypes,
      dbInstances,
      pvcStorageClasses,
      instances,
      hubTypes
    } = this.props;

    // const primary = deepPurple[200];
    const customers = Object.keys(dbInstances);
    const storageClasses = Object.keys(pvcStorageClasses);
    const manualStorage = Object.keys(manualStorageClasses);
    const types = Object.keys(hubTypes);
    const hubs = Object.keys(instances);

    // Retrieve unique certificates
    const uniqueCertificates = ["default", "manual"];
    // eslint-disable-next-line
    hubs.map(hubCrd => {
      const hub = instances[hubCrd];
      if (uniqueCertificates.indexOf(hub.spec.certificateName) === -1) {
        uniqueCertificates.push(hub.spec.certificateName);
      }
    });

    return (
      <div className={classes.formContainer}>
        <form
          id="staging-form"
          className={classes.container}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="namespace"
            name="namespace"
            label="Namespace"
            className={classes.textField}
            value={this.state.namespace}
            onChange={this.handleChange}
            margin="normal"
            autoFocus
            inputRef={el => (this.namespaceField = el)}
            error={invalidNamespace}
            helperText="Lowercase letters, numbers, and hyphens only. Cannot start or end with hypens."
          />
          <div className={classes.root}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">Black Duck Size</FormLabel>
              <RadioGroup
                aria-label="Black Duck Size"
                name="flavor"
                className={classes.group}
                value={this.state.flavor}
                onChange={this.handleChange}
              >
                {kubeSizes.map(size => {
                  return (
                    <FormControlLabel
                      key={`flavor-${size}`}
                      value={size}
                      control={<Radio color="primary" />}
                      label={size}
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          </div>
          <TextField
            id="dockerRegistry"
            name="dockerRegistry"
            label="Docker Registry"
            className={classes.textField}
            value={this.state.dockerRegistry}
            onChange={this.handleChange}
            margin="normal"
          />
          <TextField
            id="dockerRepo"
            name="dockerRepo"
            label="Docker Repo"
            className={classes.textField}
            value={this.state.dockerRepo}
            onChange={this.handleChange}
            margin="normal"
          />
          <TextField
            id="hubVersion"
            name="hubVersion"
            label="Black Duck Version"
            className={classes.textField}
            value={this.state.hubVersion}
            onChange={this.handleChange}
            margin="normal"
          />
          <TextField
            select
            id="dbPrototype"
            name="dbPrototype"
            label="Clone Database"
            className={classes.textField}
            value={this.state.dbPrototype}
            onChange={this.handleCloneSupportChange}
            SelectProps={{
              MenuProps: {
                className: classes.menu
              }
            }}
            margin="normal"
          >
            {customers.map(customer => {
              const dbInstance = dbInstances[customer];
              return (
                <MenuItem key={`dbInstance-${dbInstance}`} value={customer}>
                  {dbInstance}
                </MenuItem>
              );
            })}
          </TextField>
          <div className={classes.root}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">
                Black Duck Backup Storage Support
              </FormLabel>
              <RadioGroup
                aria-label="Black Duck Backup Storage Support"
                name="backupSupport"
                className={classes.group}
                value={this.state.backupSupport}
                onChange={this.handleBackupSupportChange}
              >
                {backupSupports.map(support => {
                  return (
                    <FormControlLabel
                      key={`backup-${support}`}
                      value={support}
                      control={<Radio color="primary" />}
                      label={support}
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          </div>
          {this.state.showBackup ? (
            <div>
              <div
                className={classnames(
                  classes.textField,
                  classes.singleRowFields
                )}
              >
                <TextField
                  id="backupInterval"
                  name="backupInterval"
                  label="Backup Interval"
                  className={classes.singleRowFieldLeft}
                  value={this.state.backupInterval}
                  onChange={this.handleChange}
                  margin="normal"
                />
                <TextField
                  select
                  id="backupUnit"
                  name="backupUnit"
                  label="Units"
                  className={classes.singleRowFieldRight}
                  value={this.state.backupUnit}
                  onChange={this.handleChange}
                  margin="normal"
                >
                  {backupUnits.map(unit => {
                    return (
                      <MenuItem key={`backup-${unit}`} value={unit}>
                        {unit}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </div>
            </div>
          ) : null}
          {this.state.showManualStorageClass ? (
            <TextField
              select
              id="pvcStorageClass"
              name="pvcStorageClass"
              label="PVC Storage Class"
              className={classes.textField}
              value={this.state.pvcStorageClass}
              onChange={this.handleStorageClassChange}
              SelectProps={{
                MenuProps: {
                  className: classes.menu
                }
              }}
              margin="normal"
            >
              {manualStorage.map(storageClass => {
                const displayValue = manualStorageClasses[storageClass];
                return (
                  <MenuItem key={`manual-${storageClass}`} value={storageClass}>
                    {displayValue}
                  </MenuItem>
                );
              })}
            </TextField>
          ) : null}
          {this.state.showBackup && !this.state.showManualStorageClass ? (
            <TextField
              select
              id="pvcStorageClass"
              name="pvcStorageClass"
              label="PVC Storage Class"
              className={classes.textField}
              value={this.state.pvcStorageClass}
              onChange={this.handleStorageClassChange}
              SelectProps={{
                MenuProps: {
                  className: classes.menu
                }
              }}
              margin="normal"
            >
              {storageClasses.map(storageClass => {
                const displayValue = pvcStorageClasses[storageClass];
                return (
                  <MenuItem
                    key={`storageClass-${storageClass}`}
                    value={storageClass}
                  >
                    {displayValue}
                  </MenuItem>
                );
              })}
            </TextField>
          ) : null}
          {this.state.showNFSPath ? (
            <TextField
              id="nfsServer"
              name="nfsServer"
              label="NFS Server Path"
              className={classes.textField}
              value={this.state.nfsServer}
              onChange={this.handleChange}
              margin="normal"
            />
          ) : null}
          {this.state.showBackup ? (
            <div
              className={classnames(classes.singleRowFields, classes.textField)}
            >
              <TextField
                select
                id="scanType"
                name="scanType"
                label="Scan Type"
                className={classes.singleRowThreeFieldMiddle}
                value={this.state.scanType}
                onChange={this.handleScanTypeChange}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu
                  }
                }}
                margin="normal"
              >
                {scanTypes.map(type => {
                  return (
                    <MenuItem key={`pv-${type}`} value={type}>
                      {type}
                    </MenuItem>
                  );
                })}
              </TextField>
              <TextField
                id="pvcClaimSize"
                name="pvcClaimSize"
                label="PVC Claim Size"
                className={classes.singleRowThreeFieldRight}
                value={this.state.pvcClaimSize}
                onChange={this.handleChange}
                margin="normal"
              />
            </div>
          ) : null}
          <div
            className={classnames(classes.singleRowFields, classes.textField)}
          >
            <TextField
              select
              id="certificateName"
              name="certificateName"
              label="Black Duck Certificate"
              className={classes.singleRowFieldLeft}
              value={this.state.certificateName}
              onChange={this.handleCertificateChanges}
              SelectProps={{
                MenuProps: {
                  className: classes.menu
                }
              }}
              margin="normal"
            >
              {uniqueCertificates.map(uniqueCertificate => {
                return (
                  <MenuItem
                    key={`certificate-${uniqueCertificate}`}
                    value={uniqueCertificate}
                  >
                    {uniqueCertificate}
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              select
              id="hubType"
              name="hubType"
              label="Black Duck Type"
              className={classes.singleRowFieldRight}
              value={this.state.hubType}
              onChange={this.handleChange}
              SelectProps={{
                MenuProps: {
                  className: classes.menu
                }
              }}
              margin="normal"
            >
              {types.map(type => {
                const displayValue = hubTypes[type];
                return (
                  <MenuItem key={`hub-${type}`} value={type}>
                    {displayValue}
                  </MenuItem>
                );
              })}
            </TextField>
          </div>
          {this.state.showCertificates ? (
            <TextField
              id="certificate"
              name="certificate"
              label="Certificate"
              multiline
              rows="2"
              rowsMax="2"
              className={classes.textField}
              value={this.state.certificate}
              onChange={this.handleChange}
              margin="normal"
            />
          ) : null}
          {this.state.showCertificates ? (
            <TextField
              id="certificateKey"
              name="certificateKey"
              label="Certificate Key"
              multiline
              rows="2"
              rowsMax="2"
              className={classes.textField}
              value={this.state.certificateKey}
              onChange={this.handleChange}
              margin="normal"
            />
          ) : null}
          {this.state.environs.map((environ, i) => {
            const keyEnviron = this.state.environs[i].key;
            const valueEnviron = this.state.environs[i].value;
            return (
              <div
                key={i}
                className={classnames(
                  classes.singleRowFields,
                  classes.textField,
                  classes.button
                )}
              >
                <TextField
                  key="key"
                  name="key"
                  label="Key"
                  className={classes.singleRowThreeFieldLeft}
                  onChange={this.handleEnvironKeyChange.bind(this, i)}
                  margin="normal"
                  value={keyEnviron}
                />
                <TextField
                  key="value"
                  name="value"
                  label="Value"
                  className={classes.singleRowThreeFieldMiddle}
                  onChange={this.handleEnvironValueChange.bind(this, i)}
                  margin="normal"
                  value={valueEnviron}
                />
                <IconButton
                  size="small"
                  className={classes.button}
                  aria-label="Delete"
                  color="default"
                  onClick={this.handleEnvironRemoveClick.bind(this, i)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            );
          })}
          <Button
            variant="contained"
            className={classes.button}
            color="secondary"
            onClick={this.handleEnvironAddClick.bind(this)}
          >
            Add Environs
          </Button>
          <TextField
            id="token"
            name="token"
            label="Token"
            className={classes.textField}
            value={this.state.token}
            onChange={this.handleChange}
            margin="normal"
          />
          <Button
            variant="contained"
            size="medium"
            className={classes.button}
            type="submit"
            color="primary"
            onClick={this.handleSubmit}
            disabled={this.state.emptyFormFields || invalidNamespace}
          >
            Submit
          </Button>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(StagingForm);

StagingForm.propTypes = {
  addInstance: PropTypes.func,
  dbInstances: PropTypes.arrayOf(PropTypes.string),
  pvcStorageClasses: PropTypes.arrayOf(PropTypes.string),
  backupUnits: PropTypes.arrayOf(PropTypes.string),
  invalidNamespace: PropTypes.bool,
  kubeSizes: PropTypes.arrayOf(PropTypes.string),
  backupSupports: PropTypes.arrayOf(PropTypes.string),
  manualStorageClasses: PropTypes.arrayOf(PropTypes.string),
  nfsServer: PropTypes.string,
  backupInterval: PropTypes.string,
  backupUnit: PropTypes.string,
  hubTypes: PropTypes.string
};
