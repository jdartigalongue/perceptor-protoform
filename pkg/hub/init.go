/*
Copyright (C) 2018 Synopsys, Inc.

Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
*/

package hub

import (
	"fmt"
	"strings"

	horizonapi "github.com/blackducksoftware/horizon/pkg/api"
	"github.com/blackducksoftware/horizon/pkg/components"
	horizon "github.com/blackducksoftware/horizon/pkg/deployer"
	"github.com/blackducksoftware/perceptor-protoform/pkg/api/hub/v1"
	"github.com/blackducksoftware/perceptor-protoform/pkg/hub/containers"
	"github.com/blackducksoftware/perceptor-protoform/pkg/util"
	log "github.com/sirupsen/logrus"
)

func (hc *Creater) init(deployer *horizon.Deployer, createHub *v1.HubSpec, hubContainerFlavor *containers.ContainerFlavor, allConfigEnv []*horizonapi.EnvConfig, adminPassword string, userPassword string) error {

	// Create a namespaces
	_, err := util.GetNamespace(hc.KubeClient, createHub.Namespace)
	if err != nil {
		log.Debugf("unable to find the namespace %s", createHub.Namespace)
		deployer.AddNamespace(components.NewNamespace(horizonapi.NamespaceConfig{Name: createHub.Namespace}))
	}

	// Create a secret
	secrets := hc.createHubSecrets(createHub, adminPassword, userPassword)

	for _, secret := range secrets {
		deployer.AddSecret(secret)
	}

	// Create a service account
	deployer.AddServiceAccount(util.CreateServiceAccount(createHub.Namespace, createHub.Namespace))

	// Create a cluster role binding and associated it to a service account
	deployer.AddClusterRoleBinding(util.CreateClusterRoleBinding(createHub.Namespace, createHub.Namespace, createHub.Namespace, "", "ClusterRole", "cluster-admin"))

	// Create ConfigMaps
	configMaps := hc.createHubConfig(createHub, hubContainerFlavor)

	for _, configMap := range configMaps {
		deployer.AddConfigMap(configMap)
	}

	var storageClass string
	if strings.EqualFold(createHub.PVCStorageClass, "none") {
		storageClass = ""
	} else {
		storageClass = createHub.PVCStorageClass
	}

	if strings.EqualFold(createHub.PVCStorageClass, "none") {
		// Postgres PV
		if strings.EqualFold(createHub.NFSServer, "") {
			return fmt.Errorf("unable to create the PV %s due to missing NFS server path", createHub.Namespace)
		}

		_, err = util.CreatePersistentVolume(hc.KubeClient, createHub.Namespace, storageClass, createHub.PVCClaimSize, hc.Config.NFSPath, createHub.NFSServer)

		if err != nil {
			return fmt.Errorf("unable to create the PV %s due to %+v", createHub.Namespace, err)
		}
	}

	if strings.EqualFold(createHub.BackupSupport, "Yes") || !strings.EqualFold(createHub.DbPrototype, "empty") {
		// Postgres PVC
		postgresPVC, err := util.CreatePersistentVolumeClaim(createHub.Namespace, createHub.Namespace, createHub.PVCClaimSize, storageClass, horizonapi.ReadWriteOnce)
		if err != nil {
			return fmt.Errorf("failed to create the postgres PVC for %s due to %+v", createHub.Namespace, err)
		}
		deployer.AddPVC(postgresPVC)
	}

	containerCreater := containers.NewCreater(hc.Config, createHub, hubContainerFlavor, nil, allConfigEnv, nil, nil)

	deployer.AddReplicationController(containerCreater.GetPostgresDeployment())
	deployer.AddService(containerCreater.GetPostgresService())
	// deployer.AddService(util.CreateService("postgres-exposed", "postgres", createHub.Spec.Namespace, postgresPort, postgresPort, horizonapi.ClusterIPServiceTypeLoadBalancer))
	return nil
}
