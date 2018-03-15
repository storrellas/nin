import * as jsonwebtoken from 'jsonwebtoken';
import * as DateDiff from 'date-diff';

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
  * Date conversion to epoch unix timestamp
  */
export function date_2_epoch_unix(date_str : string) : number{
  const date = new Date(date_str)
  return parseInt(date.getTime() / 1000)
}


/**
  * Epoch unix timestamp conversion to date
  */
export function epoch_unix_2_date(timestamp : number) : Date{
  const date : Date = new Date(0); // The 0 there is the key, which sets the date to the epoch
  date.setUTCSeconds(timestamp);
  return date
}

/**
  * Pregnancy constants
  */
export const pregnancy_weeks : number = 40
export const pregnancy_days : number = pregnancy_weeks*7

/**
  * Calculate conception date from birth_date
  */
export function calculate_conception(birth_date : Date) : Date {
  const conception_date = new Date(birth_date)
  return conception_date.setDate(conception_date.getDate()-pregnancy_days)
}

/**
  * Calculate conception date
  */
export function calculate_week_number(date : Date, birth_date: Date) : number {
  const conception_date : Date = calculate_conception(birth_date)
  const diff = new DateDiff( date, conception_date )
  return parseInt(diff.weeks())
}
