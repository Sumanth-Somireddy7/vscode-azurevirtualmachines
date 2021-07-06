/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep } from "vscode-azureextensionui";
import { localize } from "../../localize";
import { nonNullProp } from "../../utils/nonNull";
import { IVirtualMachineWizardContext } from "./IVirtualMachineWizardContext";
import { VirtualMachineOS } from "./OSListStep";

const reservedWords: string[] = ['admin', 'administrator', 'root', 'test', 'user'];

export class UsernamePromptStep extends AzureWizardPromptStep<IVirtualMachineWizardContext> {
    public async prompt(context: IVirtualMachineWizardContext): Promise<void> {
        const prompt: string = localize('usernamePrompt', 'Enter a username');
        context.adminUsername = (await context.ui.showInputBox({
            prompt,
            value: context.os === VirtualMachineOS.linux ? 'azureuser' : '',
            validateInput: async (value: string | undefined): Promise<string | undefined> => this.validateUsername(nonNullProp(context, 'os'), value)
        }));
        context.valuesToMask.push(context.adminUsername);
    }

    public shouldPrompt(context: IVirtualMachineWizardContext): boolean {
        return !context.adminUsername;
    }

    private validateUsername(os: VirtualMachineOS, value: string | undefined): string | undefined {
        const usernameMinLength: number = 1;
        const usernameMaxLength: number = os === VirtualMachineOS.linux ? 64 : 20;
        const invalidCharsRegExp: RegExp = os === VirtualMachineOS.linux ? /^[0-9|-]|[^a-zA-Z0-9\_\-]/g : /[\\\/\"\[\]\:\|\<\>\+\=\;\,\?\*\@\&]|\.$/g;

        if (!value) {
            return localize('nonEmpty', 'The username must not be empty');
        } else if (value.length < usernameMinLength || value.length > usernameMaxLength) {
            return localize('invalidLength', 'The username must be between {0} and {1} characters long', usernameMinLength, usernameMaxLength);
        } else if (invalidCharsRegExp.test(value)) {
            return os === VirtualMachineOS.linux ?
                localize('invalidLinuxUsername', 'Username must only contain letters, numbers, hyphens, and underscores and may not start with a hyphen or number.') :
                localize('invalidWindowUsername', `Username cannot contain special characters \/""[]:|<>+=;,?*@& or end with '.'`);
        } else if (reservedWords.includes(value.toLowerCase())) {
            return localize('reservedWords', 'Usernames must not include reserved words');
        } else {
            return undefined;
        }

    }
}
