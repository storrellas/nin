import * as jsonwebtoken from 'jsonwebtoken';

// Body mass index for pregnancy
export const bmi_max : number = 24.9
export const bmi_min : number = 18.5

/**
  * Gets uid token from jwt
  */
export function get_uid(token : string) : string{
  const item : any = jsonwebtoken.decode(token)
  //this.logger.debug("extracted uid: " + item.sub)
  return item.sub
}

/**
  * Gets api_key token from jwt
  */
export function get_api_key(token : string) : string{
  const item : any = jsonwebtoken.decode(token)
  //this.logger.debug("extracted uid: " + item.sub)
  return item.apiKey
}

/**
  * Calculates weight limits according to bmi formula
  * BMI = (Weight in kilograms  / Height[m]^^2)
  * https://www.fitpregnancy.com/tools/bmi-calculator
  * NORMAL (18.5 to 24.9) 25-35lbs recommended weight gain
  *
  * output[0] -> max weight
  * output[1] -> min weight
  */
export function bmi_weight_limits(height: number) : number[]{
  const weight_max = this.bmi_max * Math.pow(height,2)
  const weight_min = this.bmi_min * Math.pow(height,2)
  return [weight_max, weight_min]
}

/**
  * Gets api_key token from jwt
  */
export function date_2_epoch_unix(date_str : string) : number{
  const date = new Date(date_str)
  return parseInt(date.getTime() / 1000)
}
