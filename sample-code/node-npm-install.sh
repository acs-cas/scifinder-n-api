#!/bin/bash

if [[ -n "${VM_VERSION}" ]]; then
    exit 0
fi

set -e

# NOTE: npm 7.0.0+ displays a warning message "ExperimentalWarning: The fs.promises API is experimental" for node.js 10.
# The message should go away after node.js 12.
node_version='14.17.1'
npm_version='6.14.13'

# **NOTE** it is best practice to install npm to a user's home directory, so npm commands can be run without 'sudo'
# The disadvantage is that the PATH will need to be loaded from a user's .bashrc file instead of a system-wide PATH
# This may require a bit of attention for non-interactive shells (e.g. Dockerfile, maven)
install_folder="${HOME}/.node"

uninstall_node="true"
uninstall_npm="true"

node_binary="$(which node || echo '')"
npm_binary="$(which npm || echo '')"
bashrc="${HOME}/.bashrc"

# if you run this script multiple times in a row without sourcing bashrc, prevent it from re-uninstalling
if [[ ! "${node_binary}" || ! "${npm_binary}" ]]; then
    local_node_binary="$(find "${HOME}" -type f -name 'node' 2>/dev/null | grep -v "/.git/" | head -n 1)"
    if [[ "${local_node_binary}" ]]; then
        source "${bashrc}"
        node_binary="$(which node || echo '')"
        npm_binary="$(which npm || echo '')"
    fi
fi

label="[$(basename "${BASH_SOURCE[0]}")]"
echo-message() {
    echo "${label} $1"
}

if [[ "${node_binary}" ]]; then
    actual_node_version="$(${node_binary} --version)"
    # remove the initial character 'v' from the version string
    actual_node_version="${actual_node_version:1}"
    echo-message "node: ${actual_node_version} at ${node_binary}"
fi
if [[ "${npm_binary}" ]]; then
    actual_npm_version=$(${npm_binary} --version)
    echo-message "npm: ${actual_npm_version} at ${npm_binary}"
fi

if [[ "${node_binary}" ]]; then
    uninstall_node="false"
    if [[ ${uninstall_node} == "false" ]] && [[ ! "${node_binary}" =~ "${install_folder}" ]]; then
        echo-message "node: uninstalling! (expected to be in '${install_folder}')"
        uninstall_node="true"
    fi
    if [[ ${uninstall_node} == "false" ]] && [[ ! "${actual_node_version}" == "${node_version}" ]]; then
        echo-message "node: uninstalling! (expected ${actual_node_version} to be ${node_version})"
        uninstall_node="true"
    fi
fi
if [[ "${npm_binary}" ]]; then
    uninstall_npm="false"
    if [[ ${uninstall_npm} == "false" ]] && [[ ! "${node_binary}" ]]; then
        echo-message "npm: uninstalling! (node is missing)"
        uninstall_npm="true"
    fi
    if [[ ${uninstall_npm} == "false" ]] && [[ ! "${npm_binary}" =~ "${install_folder}" ]]; then
        echo-message "npm: uninstalling! (expected to be in '${install_folder}')"
        uninstall_npm="true"
    fi
    if [[ ${uninstall_npm} == "false" ]] && [[ ! "${actual_npm_version}" == "${npm_version}" ]]; then
        echo-message "npm: uninstalling! (expected ${actual_npm_version} to be ${npm_version})"
        uninstall_npm="true"
    fi
fi

if [[ "${uninstall_node}" == "true" ]]; then
    uninstall_npm="true"
    CWD="$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)"
    ${CWD}/node-uninstall.sh "${install_folder}"
    node_binary=''
elif [[ "${uninstall_npm}" == "true" ]]; then
    CWD="$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)"
    ${CWD}/npm-uninstall.sh "${install_folder}"
    npm_binary=''
fi

if [[ ! "${node_binary}" || ! "${npm_binary}" ]]; then
    echo-message "node: installing ${node_version} to ${install_folder}"

    base_name="node-v${node_version}"
    archive_name="${base_name}-linux-x64.tar.gz"
    # prepare the tmp folder to download the file
    temp_folder="/tmp/${base_name}"
    echo-message "node: preparing ${temp_folder}"
    rm -rf "${temp_folder}" && mkdir -p "${temp_folder}"
    # download 'node' archive to the temp folder (-P specifies an output folder)
    echo-message "node: downloading ${archive_name} to ${temp_folder}"
    wget --quiet "https://nodejs.org/dist/v${node_version}/${archive_name}" -P "${temp_folder}"
    # extract the archive
    #   -C specifies an output folder
    echo-message "node: extracting ${archive_name} to ${temp_folder}"
    tar -xf "${temp_folder}/${archive_name}" -C "${temp_folder}"
    # clean the install path so the newly extracted contents can overwrite it
    echo-message "node: moving ${archive_name} to ${install_folder}"
    rm -rf "${install_folder}"
    # move the newly extracted contents to the install path
    mv "${temp_folder}/${base_name}-linux-x64" "${install_folder}"
    # remove the tmp folder
    echo-message "node: cleaning ${temp_folder}"
    rm -rf "${temp_folder}"

    # augment PATH
    # NOTE: 'npm' global installs put a symlink in the same folder as the node executable (e.g. npm, bower)
    node_binary="$(find "${install_folder}" -type f -name 'node' 2>/dev/null)"
    npm_symlink="$(find "${install_folder}" -type l -name 'npm' 2>/dev/null)"
    npm_binary="$(find "${install_folder}" -type f -name 'npm-cli.js' 2>/dev/null)"
    if [[ ! "${node_binary}" ]]; then
        echo-message "unable to locate 'node' executable in ${install_folder}"
        exit 1
    elif [[ ! "${npm_binary}" || ! "${npm_symlink}" ]]; then
        echo-message "unable to locate 'npm' executable in ${install_folder}"
        exit 1
    else
        bashrc="${HOME}/.bashrc"
        echo-message "adding 'node' and 'npm' to PATH in ${bashrc}"
        node_path="$(dirname "${node_binary}")"
        # modify the path for the remainder of this script (and this terminal window)
        [[ "${PATH}" =~ "${node_path}" ]] || export PATH="${PATH}:${node_path}"
        # modify the path permanently in .bashrc
        # remove any line that references the install_folder from the bashrc file
        sed -i '/\/\.node/d' "${bashrc}"
        # prepend the following lines to the beginning of the bashrc file
        path_string="# PATH modifiers (e.g. /.node) should be at the top of this file (before checking if the shell is interactive)"
        path_string="${path_string}\n[[ \"\${PATH}\" =~ \"${node_path}\" ]] || export PATH=\"\${PATH}:${node_path}\""
        sed -i "1i${path_string}" "${bashrc}"

        actual_node_version="$(node --version)"
        # remove the initial character 'v' from the version string
        actual_node_version="${actual_node_version:1}"
        echo-message "node: ${actual_node_version} at $(which node)"
        actual_npm_version="$(npm --version)"
        echo-message "npm: ${actual_npm_version} at $(which npm)"
        if [[ "${actual_npm_version}" != "${npm_version}" ]]; then
            echo-message "npm: upgrading to ${npm_version}"
            npm install --no-progress -g npm@${npm_version} --registry=https://registry.npmjs.org >/dev/null
            actual_npm_version="$(npm --version)"
            echo-message "npm: ${actual_npm_version} at $(which npm)"
        fi
    fi
fi
