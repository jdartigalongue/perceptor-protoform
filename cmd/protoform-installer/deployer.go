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

package main

import (
	"fmt"
	"os"

	"github.com/blackducksoftware/perceptor-protoform/pkg/alert"
	alertv1 "github.com/blackducksoftware/perceptor-protoform/pkg/api/alert/v1"
	hubv1 "github.com/blackducksoftware/perceptor-protoform/pkg/api/hub/v1"
	opssightv1 "github.com/blackducksoftware/perceptor-protoform/pkg/api/opssight/v1"
	"github.com/blackducksoftware/perceptor-protoform/pkg/hub"
	"github.com/blackducksoftware/perceptor-protoform/pkg/opssight"
	"github.com/blackducksoftware/perceptor-protoform/pkg/protoform"
	log "github.com/sirupsen/logrus"
)

func main() {
	if len(os.Args) > 1 {
		configPath := os.Args[1]
		runProtoform(configPath)
		fmt.Printf("Config path: %s", configPath)
		return
	}
	fmt.Println("WARNING: Running protoform with defaults, no config file sent.")
	runProtoform("")
}

func runProtoform(configPath string) {
	deployer, err := protoform.NewController(configPath)
	if err != nil {
		panic(err)
	}

	stopCh := make(chan struct{})

	alertController := alert.NewCRDInstaller(deployer.Config, deployer.KubeConfig, deployer.KubeClientSet, GetAlertDefaultValue(), stopCh)
	deployer.AddController(alertController)

	hubController := hub.NewCRDInstaller(deployer.Config, deployer.KubeConfig, deployer.KubeClientSet, GetHubDefaultValue(), stopCh)
	deployer.AddController(hubController)

	opssSightController, err := opssight.NewCRDInstaller(&opssight.Config{
		Config:        deployer.Config,
		KubeConfig:    deployer.KubeConfig,
		KubeClientSet: deployer.KubeClientSet,
		Defaults:      GetOpsSightDefaultValue(),
		Threadiness:   deployer.Config.Threadiness,
		StopCh:        stopCh,
	})
	if err != nil {
		panic(err)
	}
	deployer.AddController(opssSightController)

	log.Info("Starting deployer.  All controllers have been added to horizon.")
	if err = deployer.Deploy(); err != nil {
		log.Errorf("ran into errors during deployment, but continuing anyway: %s", err.Error())
	}

	<-stopCh
}

// GetAlertDefaultValue creates a alert crd configuration object with defaults
func GetAlertDefaultValue() *alertv1.AlertSpec {
	port := 8443
	hubPort := 443
	standAlone := true

	return &alertv1.AlertSpec{
		Port:           &port,
		HubPort:        &hubPort,
		StandAlone:     &standAlone,
		AlertMemory:    "512M",
		CfsslMemory:    "640M",
		AlertImageName: "blackduck-alert",
		CfsslImageName: "hub-cfssl",
	}
}

// GetHubDefaultValue creates a hub crd configuration object with defaults
func GetHubDefaultValue() *hubv1.HubSpec {
	return &hubv1.HubSpec{
		Flavor:          "small",
		DockerRegistry:  "docker.io",
		DockerRepo:      "blackducksoftware",
		HubVersion:      "5.0.0",
		DbPrototype:     "empty",
		CertificateName: "default",
		HubType:         "worker",
		Environs:        []hubv1.Environs{},
		ImagePrefix:     "hub",
	}
}

// GetOpsSightDefaultValue creates a perceptor crd configuration object with defaults
func GetOpsSightDefaultValue() *opssightv1.OpsSightSpec {
	return &opssightv1.OpsSightSpec{
		Perceptor: &opssightv1.Perceptor{
			Name:                           "perceptor",
			Port:                           3001,
			Image:                          "gcr.io/saas-hub-stg/blackducksoftware/perceptor:master",
			CheckForStalledScansPauseHours: 999999,
			StalledScanClientTimeoutHours:  999999,
			ModelMetricsPauseSeconds:       15,
			UnknownImagePauseMilliseconds:  15000,
			ClientTimeoutMilliseconds:      100000,
		},
		Perceiver: &opssightv1.Perceiver{
			EnableImagePerceiver: false,
			EnablePodPerceiver:   true,
			Port:                 3002,
			ImagePerceiver: &opssightv1.ImagePerceiver{
				Name:  "image-perceiver",
				Image: "gcr.io/saas-hub-stg/blackducksoftware/image-perceiver:master",
			},
			PodPerceiver: &opssightv1.PodPerceiver{
				Name:  "pod-perceiver",
				Image: "gcr.io/saas-hub-stg/blackducksoftware/pod-perceiver:master",
			},
			ServiceAccount:            "perceiver",
			AnnotationIntervalSeconds: 30,
			DumpIntervalMinutes:       30,
		},
		ScannerPod: &opssightv1.ScannerPod{
			Name: "perceptor-scanner",
			ImageFacade: &opssightv1.ImageFacade{
				Port:               3004,
				InternalRegistries: []opssightv1.RegistryAuth{},
				Image:              "gcr.io/saas-hub-stg/blackducksoftware/perceptor-imagefacade:master",
				ServiceAccount:     "perceptor-scanner",
				Name:               "perceptor-imagefacade",
			},
			Scanner: &opssightv1.Scanner{
				Name:                 "perceptor-scanner",
				Port:                 3003,
				Image:                "gcr.io/saas-hub-stg/blackducksoftware/perceptor-scanner:master",
				ClientTimeoutSeconds: 600,
			},
			ReplicaCount:   1,
			ImageDirectory: "/var/images",
		},
		Skyfire: &opssightv1.Skyfire{
			Image:                        "gcr.io/saas-hub-stg/blackducksoftware/pyfire:master",
			Name:                         "skyfire",
			Port:                         3005,
			ServiceAccount:               "skyfire",
			HubClientTimeoutSeconds:      100,
			HubDumpPauseSeconds:          240,
			KubeDumpIntervalSeconds:      60,
			PerceptorDumpIntervalSeconds: 60,
		},
		Hub: &opssightv1.Hub{
			User:                         "sysadmin",
			Port:                         443,
			ConcurrentScanLimit:          2,
			TotalScanLimit:               1000,
			PasswordEnvVar:               "PCP_HUBUSERPASSWORD",
			Password:                     "blackduck",
			InitialCount:                 1,
			MaxCount:                     1,
			DeleteHubThresholdPercentage: 50,
			HubSpec:                      GetHubDefaultValue(),
		},
		EnableMetrics: true,
		EnableSkyfire: false,
		DefaultCPU:    "300m",
		DefaultMem:    "1300Mi",
		LogLevel:      "debug",
		SecretName:    "perceptor",
		ConfigMapName: "opssight",
	}
}
