// hardhat.config.js loads @nomicfoundation/hardhat-ethers at runtime, but a .js
// config is not part of the TypeScript program, so the plugin's module
// augmentation never reached the compiler and `import { ethers } from "hardhat"`
// failed with TS2305. Importing it here pulls the augmentation in.
import '@nomicfoundation/hardhat-ethers';
