import { IOSDictatorImpl } from "./IOSDictatorImpl";
import { Platform } from "react-native";
import { AndroidDictatorImpl } from "./AndroidDictatorImpl";
 
export const voiceDictator = Platform.OS === 'ios'? new IOSDictatorImpl() : new AndroidDictatorImpl()

