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

package standardperceptor

import (
	model "github.com/blackducksoftware/perceptor-protoform/contrib/hydra/pkg/model"
	"github.com/spf13/viper"
)

type AuxiliaryConfig struct {
	Namespace string

	// true -> openshift; false -> kubernetes
	IsOpenshift bool

	// AUTH CONFIGS
	// TODO Lets try to have this injected on serviceaccount
	// at pod startup, eventually Service accounts.
	PrivateDockerRegistries []model.RegistryAuth

	PodPerceiverServiceAccountName   string
	ImagePerceiverServiceAccountName string
	ImageFacadeServiceAccountName    string
}

func ReadAuxiliaryConfig(auxConfigPath string) *AuxiliaryConfig {
	viper.SetConfigFile(auxConfigPath)
	aux := &AuxiliaryConfig{}
	err := viper.ReadInConfig()
	if err != nil {
		panic(err)
	}
	viper.Unmarshal(aux)
	return aux
}
