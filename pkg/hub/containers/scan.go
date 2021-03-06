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

package containers

import (
	"fmt"

	horizonapi "github.com/blackducksoftware/horizon/pkg/api"
	"github.com/blackducksoftware/horizon/pkg/components"
	"github.com/blackducksoftware/perceptor-protoform/pkg/util"
)

// GetScanDeployment will return the scan deployment
func (c *Creater) GetScanDeployment() *components.ReplicationController {
	scannerEnvs := c.allConfigEnv
	scannerEnvs = append(scannerEnvs, &horizonapi.EnvConfig{Type: horizonapi.EnvFromConfigMap, NameOrPrefix: "HUB_MAX_MEMORY", KeyOrVal: "scan-mem", FromName: "hub-config-resources"})
	hubScanEmptyDir, _ := util.CreateEmptyDirVolumeWithoutSizeLimit("dir-scan")
	hubScanContainerConfig := &util.Container{
		ContainerConfig: &horizonapi.ContainerConfig{Name: "hub-scan", Image: fmt.Sprintf("%s/%s/%s-scan:%s", c.hubSpec.DockerRegistry, c.hubSpec.DockerRepo, c.hubSpec.ImagePrefix, c.getTag("scan")),
			PullPolicy: horizonapi.PullAlways, MinMem: c.hubContainerFlavor.ScanMemoryLimit, MaxMem: c.hubContainerFlavor.ScanMemoryLimit, MinCPU: "", MaxCPU: ""},
		EnvConfigs: scannerEnvs,
		VolumeMounts: []*horizonapi.VolumeMountConfig{
			{Name: "db-passwords", MountPath: "/tmp/secrets"},
			{Name: "dir-scan", MountPath: "/opt/blackduck/hub/hub-scan/security"}},
		PortConfig: &horizonapi.PortConfig{ContainerPort: scannerPort, Protocol: horizonapi.ProtocolTCP},
		// LivenessProbeConfigs: []*horizonapi.ProbeConfig{{
		// 	ActionConfig:    horizonapi.ActionConfig{Command: []string{"/usr/local/bin/docker-healthcheck.sh", "https://127.0.0.1:8443/api/health-checks/liveness", "/opt/blackduck/hub/hub-scan/security/root.crt"}},
		// 	Delay:           240,
		// 	Interval:        30,
		// 	Timeout:         10,
		// 	MinCountFailure: 10,
		// }},
	}
	hubScan := util.CreateReplicationControllerFromContainer(&horizonapi.ReplicationControllerConfig{Namespace: c.hubSpec.Namespace, Name: "hub-scan", Replicas: c.hubContainerFlavor.ScanReplicas}, "",
		[]*util.Container{hubScanContainerConfig}, []*components.Volume{hubScanEmptyDir, c.dbSecretVolume, c.dbEmptyDir}, []*util.Container{}, []horizonapi.AffinityConfig{})
	return hubScan
}

// GetScanService will return the scan service
func (c *Creater) GetScanService() *components.Service {
	return util.CreateService("scan", "hub-scan", c.hubSpec.Namespace, scannerPort, scannerPort, horizonapi.ClusterIPServiceTypeDefault)
}
